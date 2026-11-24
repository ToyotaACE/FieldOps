package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.InspectionAnswerRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionAnswerResponseDTO;
import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionAnswer;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.Role;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Respostas do checklist.
 *
 * Regras: somente o técnico responsável responde (RN-033), somente com a
 * inspeção em andamento (RN-043), cada resposta pertence a um item da
 * versão do modelo da inspeção (RN-035) e é validada pelo tipo (RN-036).
 */
@Service
public class InspectionAnswerService {

    private final InspectionAnswerRepository answerRepository;
    private final InspectionRepository inspectionRepository;
    private final TemplateItemRepository itemRepository;
    private final AuditLogService auditLogService;

    public InspectionAnswerService(
            InspectionAnswerRepository answerRepository,
            InspectionRepository inspectionRepository,
            TemplateItemRepository itemRepository,
            AuditLogService auditLogService
    ) {
        this.answerRepository = answerRepository;
        this.inspectionRepository = inspectionRepository;
        this.itemRepository = itemRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Cria a resposta de um item (409 se já existir).
     */
    @Transactional
    public InspectionAnswerResponseDTO save(
            Long inspectionId,
            InspectionAnswerRequestDTO dto
    ) {

        Inspection inspection = findInspection(inspectionId);

        validateTechnicianAccess(inspection);
        validateInspection(inspection);

        TemplateItem item = findItem(dto);

        validateItemVersion(inspection, item);

        if (answerRepository.existsByInspectionIdAndTemplateItemId(
                inspectionId,
                item.getId()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe uma resposta para este item."
            );
        }

        return create(inspection, item, dto);
    }

    /**
     * Cria ou atualiza a resposta de um item (idempotente). Usado pela
     * sincronização offline: reenviar a mesma resposta não duplica nada.
     */
    @Transactional
    public InspectionAnswerResponseDTO upsert(
            Long inspectionId,
            InspectionAnswerRequestDTO dto
    ) {

        Inspection inspection = findInspection(inspectionId);

        validateTechnicianAccess(inspection);
        validateInspection(inspection);

        TemplateItem item = findItem(dto);

        validateItemVersion(inspection, item);

        InspectionAnswer existing = answerRepository
                .findByInspectionIdAndTemplateItemId(
                        inspectionId,
                        item.getId()
                )
                .orElse(null);

        if (existing == null) {
            return create(inspection, item, dto);
        }

        return apply(existing, item, dto, "UPDATE");
    }

    @Transactional
    public List<InspectionAnswerResponseDTO> findByInspection(
            Long inspectionId
    ) {

        Inspection inspection = findInspection(inspectionId);

        validateReadAccess(inspection);

        return answerRepository.findByInspectionId(inspectionId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public InspectionAnswerResponseDTO update(
            Long inspectionId,
            Long answerId,
            InspectionAnswerRequestDTO dto
    ) {

        InspectionAnswer answer = answerRepository
                .findById(answerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resposta não encontrada."
                ));

        if (!answer.getInspection().getId().equals(inspectionId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "A resposta não pertence a esta inspeção."
            );
        }

        Inspection inspection = answer.getInspection();

        validateTechnicianAccess(inspection);
        validateInspection(inspection);

        return apply(answer, answer.getTemplateItem(), dto, "UPDATE");
    }

    /* ------------------------------------------------------------------ */

    private InspectionAnswerResponseDTO create(
            Inspection inspection,
            TemplateItem item,
            InspectionAnswerRequestDTO dto
    ) {

        InspectionAnswer answer = new InspectionAnswer();

        answer.setInspection(inspection);
        answer.setTemplateItem(item);

        return apply(answer, item, dto, "CREATE");
    }

    private InspectionAnswerResponseDTO apply(
            InspectionAnswer answer,
            TemplateItem item,
            InspectionAnswerRequestDTO dto,
            String auditAction
    ) {

        String value = AnswerContract.validate(item, dto.getValue());
        String observation = normalizeObservation(dto.getObservation());

        validateObservation(item, value, observation);

        answer.setValue(value);
        answer.setObservation(observation);

        InspectionAnswer saved = answerRepository.save(answer);

        auditLogService.record(
                auditAction,
                "InspectionAnswer",
                saved.getId(),
                "Resposta do item '" + item.getLabel()
                        + "' registrada na inspeção "
                        + saved.getInspection().getId()
        );

        return toResponseDTO(saved);
    }

    private TemplateItem findItem(InspectionAnswerRequestDTO dto) {

        if (dto.getTemplateItemId() == null) {
            throw new BusinessException("O item do modelo é obrigatório.");
        }

        return itemRepository
                .findById(dto.getTemplateItemId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item do modelo não encontrado."
                ));
    }

    private String normalizeObservation(String observation) {

        if (observation == null || observation.isBlank()) {
            return null;
        }

        String trimmed = observation.trim();

        if (trimmed.length() > 2000) {
            throw new BusinessException(
                    "A observação aceita até 2000 caracteres."
            );
        }

        return trimmed;
    }

    /**
     * RN-038 / RN-055: item não conforme exige observação quando configurado
     * ou quando é crítico.
     */
    private void validateObservation(
            TemplateItem item,
            String value,
            String observation
    ) {

        boolean needsObservation =
                Boolean.TRUE.equals(
                        item.getRequiresObservationOnNonconformity())
                || Boolean.TRUE.equals(
                        item.getCriticalOnNonconformity());

        if (needsObservation
                && AnswerContract.isNonConformity(value)
                && observation == null) {

            throw new BusinessException(
                    "É obrigatório informar uma observação para o item não conforme: "
                            + item.getLabel()
            );
        }
    }

    private Inspection findInspection(Long inspectionId) {

        return inspectionRepository
                .findById(inspectionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inspeção não encontrada."
                ));
    }

    private void validateTechnicianAccess(Inspection inspection) {

        User user = getAuthenticatedUser();

        if (user.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente técnicos podem responder à inspeção."
            );
        }

        if (inspection.getTechnician() == null
                || !inspection.getTechnician().getId().equals(user.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para responder a esta inspeção."
            );
        }
    }

    private void validateReadAccess(Inspection inspection) {

        User user = getAuthenticatedUser();

        if (user.getRole() == Role.ADMIN
                || user.getRole() == Role.SUPERVISOR) {
            return;
        }

        if (user.getRole() == Role.TECHNICIAN
                && inspection.getTechnician() != null
                && inspection.getTechnician().getId().equals(user.getId())) {
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Você não tem permissão para consultar estas respostas."
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

    private void validateInspection(Inspection inspection) {

        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Só é permitido alterar respostas durante a execução da inspeção."
            );
        }
    }

    private void validateItemVersion(
            Inspection inspection,
            TemplateItem item
    ) {

        if (!item.getSection()
                .getTemplateVersion()
                .getId()
                .equals(inspection.getTemplateVersion().getId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O item não pertence à versão do modelo desta inspeção."
            );
        }
    }

    private InspectionAnswerResponseDTO toResponseDTO(
            InspectionAnswer answer
    ) {

        InspectionAnswerResponseDTO dto =
                new InspectionAnswerResponseDTO();

        dto.setId(answer.getId());
        dto.setInspectionId(answer.getInspection().getId());
        dto.setTemplateItemId(answer.getTemplateItem().getId());
        dto.setValue(answer.getValue());
        dto.setObservation(answer.getObservation());
        dto.setCreatedAt(answer.getCreatedAt());
        dto.setUpdatedAt(answer.getUpdatedAt());

        return dto;
    }
}
