package com.fieldops.fieldops_api.services;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fieldops.fieldops_api.dto.InspectionAnswerRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionAnswerResponseDTO;
import com.fieldops.fieldops_api.dto.InspectionExecutionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.dto.NonConformityRequestDTO;
import com.fieldops.fieldops_api.dto.NonConformityResponseDTO;
import com.fieldops.fieldops_api.dto.SyncDTOs.BatchRequest;
import com.fieldops.fieldops_api.dto.SyncDTOs.BatchResponse;
import com.fieldops.fieldops_api.dto.SyncDTOs.OperationRequest;
import com.fieldops.fieldops_api.dto.SyncDTOs.OperationResult;
import com.fieldops.fieldops_api.entities.SyncOperation;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.SyncOperationRepository;

/**
 * Processa o lote de operações enviado pelo aplicativo.
 *
 * - As operações são aplicadas na ordem recebida.
 * - Cada operação possui sua própria transação: a falha de uma não desfaz
 *   as outras (RN-070).
 * - O operationId é único: reenviar uma operação já aplicada devolve
 *   DUPLICATE sem repetir nenhum efeito (RN-067 / RN-068).
 * - Somente operações APLICADAS são registradas; uma rejeição pode ser
 *   reenviada depois de corrigida a causa.
 *
 * Esta classe NÃO é transacional de propósito.
 */
@Service
public class SyncService {

    private static final Logger log =
            LoggerFactory.getLogger(SyncService.class);

    private final SyncOperationRepository operationRepository;
    private final InspectionService inspectionService;
    private final InspectionAnswerService answerService;
    private final NonConformityService nonConformityService;

    public SyncService(
            SyncOperationRepository operationRepository,
            InspectionService inspectionService,
            InspectionAnswerService answerService,
            NonConformityService nonConformityService) {

        this.operationRepository = operationRepository;
        this.inspectionService = inspectionService;
        this.answerService = answerService;
        this.nonConformityService = nonConformityService;
    }

    public BatchResponse process(BatchRequest batch) {

        User user = getAuthenticatedUser();

        List<OperationResult> results = new ArrayList<>();

        for (OperationRequest operation : batch.operations()) {
            results.add(processOne(operation, user));
        }

        return new BatchResponse(results, OffsetDateTime.now());
    }

    private OperationResult processOne(OperationRequest op, User user) {

        String operationId = op.operationId().trim();

        SyncOperation previous = operationRepository
                .findByOperationId(operationId)
                .orElse(null);

        if (previous != null) {

            if (!previous.getUserId().equals(user.getId())) {
                return rejected(
                        operationId,
                        "Identificador de operação já utilizado por outro usuário."
                );
            }

            return new OperationResult(
                    operationId,
                    "DUPLICATE",
                    previous.getEntityId(),
                    previous.getMessage(),
                    null,
                    null,
                    null
            );
        }

        try {

            OperationResult applied = apply(op, operationId);

            SyncOperation record = new SyncOperation();

            record.setOperationId(operationId);
            record.setUserId(user.getId());
            record.setType(op.type().trim().toUpperCase());
            record.setInspectionId(op.inspectionId());
            record.setResult("APPLIED");
            record.setEntityId(applied.entityId());
            record.setMessage(applied.message());

            operationRepository.save(record);

            return applied;

        } catch (BusinessException
                 | AccessDeniedException
                 | IllegalArgumentException
                 | IllegalStateException exception) {

            return rejected(operationId, exception.getMessage());

        } catch (ResponseStatusException exception) {

            return rejected(
                    operationId,
                    exception.getReason() != null
                            ? exception.getReason()
                            : exception.getStatusCode().toString()
            );

        } catch (RuntimeException exception) {

            log.error("Falha ao processar operação " + operationId, exception);

            return rejected(
                    operationId,
                    "Erro interno ao processar a operação."
            );
        }
    }

    private OperationResult apply(OperationRequest op, String operationId) {

        String type = op.type().trim().toUpperCase();

        switch (type) {

            case "START": {
                InspectionResponseDTO inspection = inspectionService.start(
                        op.inspectionId(),
                        execution(op)
                );

                return applied(operationId, op.inspectionId(),
                        "Inspeção iniciada", null, null, inspection);
            }

            case "COMPLETE": {
                InspectionResponseDTO inspection = inspectionService.complete(
                        op.inspectionId(),
                        execution(op)
                );

                return applied(operationId, op.inspectionId(),
                        "Inspeção concluída", null, null, inspection);
            }

            case "REOPEN": {
                InspectionResponseDTO inspection =
                        inspectionService.reopen(op.inspectionId());

                return applied(operationId, op.inspectionId(),
                        "Inspeção reaberta", null, null, inspection);
            }

            case "ANSWER": {
                InspectionAnswerRequestDTO request =
                        new InspectionAnswerRequestDTO();

                request.setTemplateItemId(op.templateItemId());
                request.setValue(op.value());
                request.setObservation(op.observation());

                InspectionAnswerResponseDTO answer =
                        answerService.upsert(op.inspectionId(), request);

                return applied(operationId, answer.getId(),
                        "Resposta registrada", answer, null, null);
            }

            case "NONCONFORMITY": {

                NonConformityRequestDTO source = op.nonConformity();

                if (source == null) {
                    throw new BusinessException(
                            "Os dados da não conformidade são obrigatórios."
                    );
                }

                NonConformityRequestDTO request = new NonConformityRequestDTO(
                        source.templateItemId(),
                        source.severity(),
                        source.type(),
                        source.description(),
                        source.probableCause(),
                        source.recommendedAction(),
                        source.technicalNotes(),
                        operationId
                );

                NonConformityResponseDTO created =
                        nonConformityService.create(
                                op.inspectionId(),
                                request
                        );

                return applied(operationId, created.id(),
                        "Não conformidade registrada", null, created, null);
            }

            default:
                throw new BusinessException(
                        "Tipo de operação desconhecido: " + op.type()
                );
        }
    }

    private InspectionExecutionRequestDTO execution(OperationRequest op) {

        return new InspectionExecutionRequestDTO(
                op.deviceTime(),
                op.latitude(),
                op.longitude(),
                op.accuracy(),
                op.locationTime()
        );
    }

    private OperationResult applied(
            String operationId,
            Long entityId,
            String message,
            InspectionAnswerResponseDTO answer,
            NonConformityResponseDTO nonConformity,
            InspectionResponseDTO inspection) {

        return new OperationResult(
                operationId,
                "APPLIED",
                entityId,
                message,
                answer,
                nonConformity,
                inspection
        );
    }

    private OperationResult rejected(String operationId, String message) {

        return new OperationResult(
                operationId,
                "REJECTED",
                null,
                message,
                null,
                null,
                null
        );
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof User user)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não autenticado."
            );
        }

        return user;
    }
}
