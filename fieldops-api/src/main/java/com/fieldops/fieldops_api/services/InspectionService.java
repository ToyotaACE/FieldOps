
package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.InspectionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.entities.*;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.InspectionRepository;
import com.fieldops.fieldops_api.repositories.InspectionSiteRepository;
import com.fieldops.fieldops_api.repositories.EquipmentRepository;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionEvidenceRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;
import com.fieldops.fieldops_api.repositories.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionTemplateVersionRepository versionRepository;
    private final InspectionSiteRepository siteRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final InspectionAnswerRepository answerRepository;
    private final InspectionEvidenceRepository evidenceRepository;
    private final TemplateSectionRepository sectionRepository;
    private final TemplateItemRepository itemRepository;
    private final AuditLogService auditLogService;

    public InspectionService(
            InspectionRepository inspectionRepository,
            InspectionTemplateVersionRepository versionRepository,
            InspectionSiteRepository siteRepository,
            EquipmentRepository equipmentRepository,
            UserRepository userRepository,
            InspectionAnswerRepository answerRepository,
            InspectionEvidenceRepository evidenceRepository,
            TemplateSectionRepository sectionRepository,
            TemplateItemRepository itemRepository,
            AuditLogService auditLogService
    ) {
        this.inspectionRepository = inspectionRepository;
        this.versionRepository = versionRepository;
        this.siteRepository = siteRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
        this.answerRepository = answerRepository;
        this.evidenceRepository = evidenceRepository;
        this.sectionRepository = sectionRepository;
        this.itemRepository = itemRepository;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // CRIAR INSPEÇÃO
    // =========================================================

    @Transactional
    public InspectionResponseDTO create(InspectionRequestDTO dto) {

        InspectionTemplateVersion version = versionRepository
                .findById(dto.getTemplateVersionId())
                .orElseThrow(() -> new RuntimeException(
                        "Versão do modelo de inspeção não encontrada."
                ));

        if (!version.getPublished()) {
            throw new RuntimeException(
                    "A inspeção só pode utilizar uma versão publicada do modelo."
            );
        }

        InspectionSite site = siteRepository
                .findById(dto.getSiteId())
                .orElseThrow(() -> new RuntimeException(
                        "Local da inspeção não encontrado."
                ));

        if (!site.getActive()) {
            throw new RuntimeException(
                    "O local da inspeção está inativo."
            );
        }

        Equipment equipment = equipmentRepository
                .findById(dto.getEquipmentId())
                .orElseThrow(() -> new RuntimeException(
                        "Equipamento não encontrado."
                ));

        if (!equipment.getActive()) {
            throw new RuntimeException(
                    "O equipamento está inativo."
            );
        }

        if (!equipment.getSite().getId().equals(site.getId())) {
            throw new RuntimeException(
                    "O equipamento não pertence ao local informado."
            );
        }

        User technician = userRepository
                .findById(dto.getTechnicianId())
                .orElseThrow(() -> new RuntimeException(
                        "Técnico não encontrado."
                ));

        if (!technician.getActive()) {
            throw new RuntimeException(
                    "O técnico está inativo."
            );
        }

        Inspection inspection = new Inspection();

        inspection.setTitle(dto.getTitle());
        inspection.setTemplateVersion(version);
        inspection.setClient(site.getClient());
        inspection.setSite(site);
        inspection.setEquipment(equipment);
        inspection.setTechnician(technician);
        inspection.setScheduledDate(dto.getScheduledDate());
        inspection.setScheduledTime(dto.getScheduledTime());

        inspection.setPriority(
                dto.getPriority() == null
                        ? InspectionPriority.NORMAL
                        : dto.getPriority()
        );

        inspection.setStatus(InspectionStatus.SCHEDULED);

        Inspection saved = inspectionRepository.save(inspection);

        auditLogService.record(
                "CREATE",
                "Inspection",
                saved.getId(),
                "Inspeção criada: " + saved.getTitle()
        );

        return toResponseDTO(saved);
    }

    // =========================================================
    // CONSULTAR TODAS AS INSPEÇÕES
    // =========================================================

    @Transactional
    public List<InspectionResponseDTO> findAll() {

        User user = getAuthenticatedUser();

        if (user.getRole() == Role.TECHNICIAN) {
            return inspectionRepository
                    .findByTechnicianId(user.getId())
                    .stream()
                    .map(this::toResponseDTO)
                    .toList();
        }

        if (user.getRole() == Role.ADMIN
                || user.getRole() == Role.SUPERVISOR) {

            return inspectionRepository.findAll()
                    .stream()
                    .map(this::toResponseDTO)
                    .toList();
        }

        throw new AccessDeniedException(
                "Usuário sem permissão para consultar inspeções."
        );
    }

    // =========================================================
    // CONSULTAR INSPEÇÃO POR ID
    // =========================================================

    @Transactional
    public InspectionResponseDTO findById(Long id) {

        User user = getAuthenticatedUser();

        Inspection inspection = inspectionRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Inspeção não encontrada."
                ));

        validateInspectionAccess(inspection, user);

        return toResponseDTO(inspection);
    }

    // =========================================================
    // CONSULTAR INSPEÇÕES POR TÉCNICO
    // =========================================================

    @Transactional
    public List<InspectionResponseDTO> findByTechnician(Long technicianId) {

        User user = getAuthenticatedUser();

        if (user.getRole() == Role.TECHNICIAN
                && !user.getId().equals(technicianId)) {

            throw new AccessDeniedException(
                    "Você só pode consultar suas próprias inspeções."
            );
        }

        validateReadPermission(user);

        return inspectionRepository.findByTechnicianId(technicianId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // =========================================================
    // CONSULTAR INSPEÇÕES POR LOCAL
    // =========================================================

    @Transactional
    public List<InspectionResponseDTO> findBySite(Long siteId) {

        User user = getAuthenticatedUser();
        validateReadPermission(user);

        List<Inspection> inspections =
                inspectionRepository.findBySiteId(siteId);

        return filterInspectionsByUser(inspections, user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // =========================================================
    // CONSULTAR INSPEÇÕES POR EQUIPAMENTO
    // =========================================================

    @Transactional
    public List<InspectionResponseDTO> findByEquipment(Long equipmentId) {

        User user = getAuthenticatedUser();
        validateReadPermission(user);

        List<Inspection> inspections =
                inspectionRepository.findByEquipmentId(equipmentId);

        return filterInspectionsByUser(inspections, user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // =========================================================
    // CONSULTAR INSPEÇÕES POR STATUS
    // =========================================================

    @Transactional
    public List<InspectionResponseDTO> findByStatus(
            InspectionStatus status
    ) {

        User user = getAuthenticatedUser();
        validateReadPermission(user);

        List<Inspection> inspections =
                inspectionRepository.findByStatus(status);

        return filterInspectionsByUser(inspections, user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // =========================================================
    // ATUALIZAR STATUS DA INSPEÇÃO
    // =========================================================

    @Transactional
    public InspectionResponseDTO updateStatus(
            Long id,
            InspectionStatus status
    ) {

        Inspection inspection = inspectionRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Inspeção não encontrada."
                ));

        User user = getAuthenticatedUser();

        InspectionStatus currentStatus = inspection.getStatus();

        // Iniciar execução: somente o técnico responsável.
        if (status == InspectionStatus.IN_PROGRESS) {

            if (user.getRole() != Role.TECHNICIAN) {
                throw new AccessDeniedException(
                        "Somente o técnico pode iniciar a inspeção."
                );
            }

            if (!inspection.getTechnician().getId().equals(user.getId())) {
                throw new AccessDeniedException(
                        "Somente o técnico responsável pode iniciar a inspeção."
                );
            }

            if (currentStatus != InspectionStatus.SCHEDULED) {
                throw new IllegalStateException(
                        "Somente inspeções agendadas podem ser iniciadas."
                );
            }
        }

        // Concluir execução: somente o técnico responsável.
        else if (status == InspectionStatus.COMPLETED) {

            if (user.getRole() != Role.TECHNICIAN) {
                throw new AccessDeniedException(
                        "Somente o técnico pode concluir a inspeção."
                );
            }

            if (!inspection.getTechnician().getId().equals(user.getId())) {
                throw new AccessDeniedException(
                        "Somente o técnico responsável pode concluir a inspeção."
                );
            }

            if (currentStatus != InspectionStatus.IN_PROGRESS) {
                throw new BusinessException(
                        "Somente inspeções em andamento podem ser concluídas."
                );
            }

            validateInspectionCompletion(inspection);
        }

        // Iniciar revisão: somente supervisor.
        else if (status == InspectionStatus.UNDER_REVIEW) {

            if (user.getRole() != Role.SUPERVISOR) {
                throw new AccessDeniedException(
                        "Somente o supervisor pode iniciar a revisão."
                );
            }

            if (currentStatus != InspectionStatus.COMPLETED) {
                throw new IllegalStateException(
                        "Somente inspeções concluídas podem entrar em revisão."
                );
            }
        }

        // Aprovar ou rejeitar: somente supervisor durante a revisão.
        else if (status == InspectionStatus.APPROVED
                || status == InspectionStatus.REJECTED) {

            if (user.getRole() != Role.SUPERVISOR) {
                throw new AccessDeniedException(
                        "Somente o supervisor pode aprovar ou rejeitar."
                );
            }

            if (currentStatus != InspectionStatus.UNDER_REVIEW) {
                throw new IllegalStateException(
                        "A inspeção precisa estar em revisão."
                );
            }
        }

        // Outras transições não são permitidas por este endpoint.
        else {
            throw new IllegalArgumentException(
                    "Transição de status não permitida."
            );
        }

        inspection.setStatus(status);

        Inspection updated = inspectionRepository.save(inspection);

        auditLogService.record(
                "STATUS_CHANGE",
                "Inspection",
                updated.getId(),
                "Status da inspeção alterado de "
                        + currentStatus
                        + " para "
                        + status
                        + ". Inspeção: "
                        + updated.getTitle()
        );

        return toResponseDTO(updated);
    }

    // =========================================================
    // VALIDAR RESPOSTAS E EVIDÊNCIAS ANTES DA CONCLUSÃO
    // =========================================================

    private void validateInspectionCompletion(Inspection inspection) {

        Long templateVersionId =
                inspection.getTemplateVersion().getId();

        List<TemplateSection> sections =
                sectionRepository
                        .findByTemplateVersionIdOrderByDisplayOrderAsc(
                                templateVersionId
                        );

        for (TemplateSection section : sections) {

            List<TemplateItem> items =
                    itemRepository
                            .findBySectionIdOrderByDisplayOrderAsc(
                                    section.getId()
                            );

            for (TemplateItem item : items) {

                boolean required =
                        Boolean.TRUE.equals(item.getRequired());

                boolean requiresEvidence =
                        Boolean.TRUE.equals(item.getRequiresEvidence());

                if (!required && !requiresEvidence) {
                    continue;
                }

                InspectionAnswer answer =
                        answerRepository
                                .findByInspectionIdAndTemplateItemId(
                                        inspection.getId(),
                                        item.getId()
                                )
                                .orElse(null);

                if (answer == null) {
                    throw new BusinessException(
                            "O item obrigatório não foi respondido: "
                                    + item.getLabel()
                    );
                }

                if (requiresEvidence
                        && !evidenceRepository
                                .existsByInspectionAnswerId(
                                        answer.getId()
                                )) {

                    throw new BusinessException(
                            "O item exige evidência, mas nenhuma evidência foi enviada: "
                                    + item.getLabel()
                    );
                }
            }
        }
    }

    // =========================================================
    // MÉTODOS AUXILIARES DE AUTORIZAÇÃO
    // =========================================================

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User user)) {

            throw new AccessDeniedException(
                    "Usuário não autenticado."
            );
        }

        return user;
    }

    private void validateReadPermission(User user) {

        if (user.getRole() != Role.ADMIN
                && user.getRole() != Role.SUPERVISOR
                && user.getRole() != Role.TECHNICIAN) {

            throw new AccessDeniedException(
                    "Usuário sem permissão para consultar inspeções."
            );
        }
    }

    private void validateInspectionAccess(
            Inspection inspection,
            User user
    ) {

        validateReadPermission(user);

        if (user.getRole() == Role.TECHNICIAN
                && !inspection.getTechnician().getId().equals(user.getId())) {

            throw new AccessDeniedException(
                    "Você não tem permissão para consultar esta inspeção."
            );
        }
    }

    private List<Inspection> filterInspectionsByUser(
            List<Inspection> inspections,
            User user
    ) {

        if (user.getRole() == Role.TECHNICIAN) {

            return inspections.stream()
                    .filter(inspection ->
                            inspection.getTechnician().getId()
                                    .equals(user.getId())
                    )
                    .toList();
        }

        return inspections;
    }

    // =========================================================
    // CONVERTER INSPEÇÃO PARA DTO
    // =========================================================

    private InspectionResponseDTO toResponseDTO(
            Inspection inspection
    ) {

        InspectionResponseDTO dto = new InspectionResponseDTO();

        dto.setId(inspection.getId());
        dto.setTitle(inspection.getTitle());

        dto.setTemplateVersionId(
                inspection.getTemplateVersion().getId()
        );

        dto.setClientId(
                inspection.getClient().getId()
        );

        dto.setSiteId(
                inspection.getSite().getId()
        );

        dto.setEquipmentId(
                inspection.getEquipment().getId()
        );

        dto.setTechnicianId(
                inspection.getTechnician().getId()
        );

        // NOVOS CAMPOS: nomes das entidades relacionadas.
        dto.setClientName(
                inspection.getClient().getName()
        );

        dto.setSiteName(
                inspection.getSite().getName()
        );

        dto.setEquipmentName(
                inspection.getEquipment().getName()
        );

        dto.setTechnicianName(
                inspection.getTechnician().getName()
        );

        dto.setScheduledDate(
                inspection.getScheduledDate()
        );

        dto.setScheduledTime(
                inspection.getScheduledTime()
        );

        dto.setPriority(
                inspection.getPriority()
        );

        dto.setStatus(
                inspection.getStatus()
        );

        dto.setCreatedAt(
                inspection.getCreatedAt()
        );

        dto.setUpdatedAt(
                inspection.getUpdatedAt()
        );

        return dto;
    }
}
