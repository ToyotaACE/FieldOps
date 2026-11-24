package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fieldops.fieldops_api.dto.NonConformityRequestDTO;
import com.fieldops.fieldops_api.dto.NonConformityResponseDTO;
import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.NonConformity;
import com.fieldops.fieldops_api.entities.NonConformityStatus;
import com.fieldops.fieldops_api.entities.Role;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.InspectionRepository;
import com.fieldops.fieldops_api.repositories.NonConformityRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;

/**
 * Não conformidades registradas pelo técnico durante a inspeção
 * (RN-052 a RN-057). Nunca são excluídas.
 */
@Service
public class NonConformityService {

    private final NonConformityRepository repository;
    private final InspectionRepository inspectionRepository;
    private final TemplateItemRepository itemRepository;
    private final AuditLogService auditLogService;

    public NonConformityService(
            NonConformityRepository repository,
            InspectionRepository inspectionRepository,
            TemplateItemRepository itemRepository,
            AuditLogService auditLogService) {

        this.repository = repository;
        this.inspectionRepository = inspectionRepository;
        this.itemRepository = itemRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Cria a não conformidade. Se o clientOperationId já existir, devolve
     * o registro existente (idempotência).
     */
    @Transactional
    public NonConformityResponseDTO create(
            Long inspectionId,
            NonConformityRequestDTO dto) {

        String operationId = blankToNull(dto.clientOperationId());

        if (operationId != null) {
            NonConformity existing = repository
                    .findByClientOperationId(operationId)
                    .orElse(null);

            if (existing != null) {
                return toDto(existing);
            }
        }

        if (dto.severity() == null) {
            throw new BusinessException("A criticidade da não conformidade é obrigatória.");
        }

        if (dto.description() == null || dto.description().isBlank()) {
            throw new BusinessException("A descrição da não conformidade é obrigatória.");
        }

        Inspection inspection = findInspection(inspectionId);
        User user = getAuthenticatedUser();

        if (user.getRole() != Role.TECHNICIAN
                || !inspection.getTechnician().getId().equals(user.getId())) {

            throw new AccessDeniedException(
                    "Somente o técnico responsável pode registrar não conformidades."
            );
        }

        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Só é possível registrar não conformidades durante a execução da inspeção."
            );
        }

        TemplateItem item = null;

        if (dto.templateItemId() != null) {

            item = itemRepository.findById(dto.templateItemId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Item do modelo não encontrado."
                    ));

            if (!item.getSection().getTemplateVersion().getId()
                    .equals(inspection.getTemplateVersion().getId())) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O item não pertence à versão do modelo desta inspeção."
                );
            }
        }

        NonConformity nonConformity = new NonConformity();

        nonConformity.setInspection(inspection);
        nonConformity.setTemplateItem(item);
        nonConformity.setSeverity(dto.severity());
        nonConformity.setStatus(NonConformityStatus.OPEN);
        nonConformity.setType(blankToNull(dto.type()));
        nonConformity.setDescription(dto.description().trim());
        nonConformity.setProbableCause(blankToNull(dto.probableCause()));
        nonConformity.setRecommendedAction(blankToNull(dto.recommendedAction()));
        nonConformity.setTechnicalNotes(blankToNull(dto.technicalNotes()));
        nonConformity.setCreatedById(user.getId());
        nonConformity.setCreatedByName(user.getName());
        nonConformity.setClientOperationId(operationId);

        NonConformity saved = repository.save(nonConformity);

        auditLogService.record(
                "CREATE",
                "NonConformity",
                saved.getId(),
                "Não conformidade (" + saved.getSeverity()
                        + ") registrada na inspeção " + inspection.getId()
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<NonConformityResponseDTO> findByInspection(Long inspectionId) {

        Inspection inspection = findInspection(inspectionId);

        User user = getAuthenticatedUser();

        if (user.getRole() == Role.TECHNICIAN
                && !inspection.getTechnician().getId().equals(user.getId())) {

            throw new AccessDeniedException(
                    "Você não tem permissão para consultar esta inspeção."
            );
        }

        return repository
                .findByInspectionIdOrderByCreatedAtAsc(inspectionId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public NonConformityResponseDTO toDto(NonConformity item) {

        return new NonConformityResponseDTO(
                item.getId(),
                item.getInspection().getId(),
                item.getTemplateItem() == null
                        ? null
                        : item.getTemplateItem().getId(),
                item.getSeverity(),
                item.getStatus(),
                item.getType(),
                item.getDescription(),
                item.getProbableCause(),
                item.getRecommendedAction(),
                item.getTechnicalNotes(),
                item.getCreatedByName(),
                item.getClientOperationId(),
                item.getCreatedAt()
        );
    }

    private Inspection findInspection(Long id) {

        return inspectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inspeção não encontrada."
                ));
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof User user)) {

            throw new AccessDeniedException("Usuário não autenticado.");
        }

        return user;
    }

    private String blankToNull(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
