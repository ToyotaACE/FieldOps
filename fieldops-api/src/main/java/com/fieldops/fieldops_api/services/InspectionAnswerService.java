package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.InspectionAnswerRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionAnswerResponseDTO;
import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionAnswer;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.Role;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.User;
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

@Service
public class InspectionAnswerService {

    private final InspectionAnswerRepository answerRepository;
    private final InspectionRepository inspectionRepository;
    private final TemplateItemRepository itemRepository;

    public InspectionAnswerService(
            InspectionAnswerRepository answerRepository,
            InspectionRepository inspectionRepository,
            TemplateItemRepository itemRepository
    ) {
        this.answerRepository = answerRepository;
        this.inspectionRepository = inspectionRepository;
        this.itemRepository = itemRepository;
    }

    @Transactional
    public InspectionAnswerResponseDTO save(
            Long inspectionId,
            InspectionAnswerRequestDTO dto
    ) {
        Inspection inspection = findInspection(inspectionId);

        validateTechnicianAccess(inspection);
        validateInspection(inspection);

        TemplateItem item = itemRepository
                .findById(dto.getTemplateItemId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item do modelo não encontrado."
                ));

        validateItemVersion(inspection, item);
        validateObservation(item, dto);

        if (answerRepository.existsByInspectionIdAndTemplateItemId(
                inspectionId,
                item.getId()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe uma resposta para este item."
            );
        }

        InspectionAnswer answer = new InspectionAnswer();
        answer.setInspection(inspection);
        answer.setTemplateItem(item);
        answer.setValue(dto.getValue());
        answer.setObservation(dto.getObservation());

        return toResponseDTO(answerRepository.save(answer));
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
        validateObservation(answer.getTemplateItem(), dto);

        answer.setValue(dto.getValue());
        answer.setObservation(dto.getObservation());

        return toResponseDTO(answerRepository.save(answer));
    }

    private void validateObservation(
            TemplateItem item,
            InspectionAnswerRequestDTO dto
    ) {
        if (Boolean.TRUE.equals(
                item.getRequiresObservationOnNonconformity())
                && "NONCONFORM".equalsIgnoreCase(dto.getValue())
                && (dto.getObservation() == null
                || dto.getObservation().isBlank())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "É obrigatório informar uma observação para este item não conforme."
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