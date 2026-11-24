package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.InspectionExecutionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.entities.*;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.EquipmentRepository;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionEvidenceRepository;
import com.fieldops.fieldops_api.repositories.InspectionRepository;
import com.fieldops.fieldops_api.repositories.InspectionSiteRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;
import com.fieldops.fieldops_api.repositories.NonConformityRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;
import com.fieldops.fieldops_api.repositories.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Planejamento, execução e revisão das inspeções.
 *
 * Máquina de estados (RN-089):
 *
 * SCHEDULED    -> IN_PROGRESS (técnico responsável)
 * IN_PROGRESS  -> COMPLETED   (técnico responsável)
 * COMPLETED    -> UNDER_REVIEW (supervisor)
 * UNDER_REVIEW -> APPROVED | REJECTED (supervisor)
 * REJECTED     -> IN_PROGRESS (técnico responsável, correção)
 * qualquer estado exceto APPROVED/CANCELLED -> CANCELLED (admin/supervisor)
 */
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
    private final NonConformityRepository nonConformityRepository;
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
            NonConformityRepository nonConformityRepository,
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
        this.nonConformityRepository = nonConformityRepository;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // CRIAR INSPEÇÃO
    // =========================================================

    @Transactional
    public InspectionResponseDTO create(InspectionRequestDTO dto) {

        InspectionTemplateVersion version = versionRepository
                .findById(dto.getTemplateVersionId())
                .orElseThrow(() -> new BusinessException(
                        "Versão do modelo de inspeção não encontrada."
                ));

        if (!Boolean.TRUE.equals(version.getPublished())) {
            throw new BusinessException(
                    "A inspeção só pode utilizar uma versão publicada do modelo."
            );
        }

        if (!Boolean.TRUE.equals(version.getTemplate().getActive())) {
            throw new BusinessException(
                    "O modelo de inspeção está inativo."
            );
        }

        InspectionSite site = siteRepository
                .findById(dto.getSiteId())
                .orElseThrow(() -> new BusinessException(
                        "Local da inspeção não encontrado."
                ));

        if (!Boolean.TRUE.equals(site.getActive())) {
            throw new BusinessException(
                    "O local da inspeção está inativo."
            );
        }

        if (dto.getClientId() != null
                && !site.getClient().getId().equals(dto.getClientId())) {
            throw new BusinessException(
                    "O local informado não pertence ao cliente selecionado."
            );
        }

        Equipment equipment = equipmentRepository
                .findById(dto.getEquipmentId())
                .orElseThrow(() -> new BusinessException(
                        "Equipamento não encontrado."
                ));

        if (!Boolean.TRUE.equals(equipment.getActive())) {
            throw new BusinessException(
                    "O equipamento está inativo."
            );
        }

        if (!equipment.getSite().getId().equals(site.getId())) {
            throw new BusinessException(
                    "O equipamento não pertence ao local informado."
            );
        }

        User technician = userRepository
                .findById(dto.getTechnicianId())
                .orElseThrow(() -> new BusinessException(
                        "Técnico não encontrado."
                ));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new BusinessException(
                    "O usuário informado não possui o perfil de técnico."
            );
        }

        if (!Boolean.TRUE.equals(technician.getActive())) {
            throw new BusinessException(
                    "O técnico está inativo."
            );
        }

        Inspection inspection = new Inspection();

        inspection.setTitle(dto.getTitle());
        inspection.setInstructions(blankToNull(dto.getInstructions()));
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
                        + " (técnico: " + technician.getName() + ")"
        );

        return toResponseDTO(saved);
    }

    // =========================================================
    // CONSULTAS
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

    @Transactional
    public InspectionResponseDTO findById(Long id) {

        User user = getAuthenticatedUser();

        Inspection inspection = findInspection(id);

        validateInspectionAccess(inspection, user);

        return toResponseDTO(inspection);
    }

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

    @Transactional
    public List<InspectionResponseDTO> findBySite(Long siteId) {

        User user = getAuthenticatedUser();

        validateReadPermission(user);

        return filterInspectionsByUser(
                inspectionRepository.findBySiteId(siteId), user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public List<InspectionResponseDTO> findByEquipment(Long equipmentId) {

        User user = getAuthenticatedUser();

        validateReadPermission(user);

        return filterInspectionsByUser(
                inspectionRepository.findByEquipmentId(equipmentId), user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public List<InspectionResponseDTO> findByStatus(InspectionStatus status) {

        User user = getAuthenticatedUser();

        validateReadPermission(user);

        return filterInspectionsByUser(
                inspectionRepository.findByStatus(status), user)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    // =========================================================
    // TRANSIÇÕES DE ESTADO
    // =========================================================

    /**
     * Compatibilidade com PATCH /{id}/status. Aprovação e reprovação
     * possuem endpoints próprios porque a reprovação exige motivo.
     */
    @Transactional
    public InspectionResponseDTO updateStatus(
            Long id,
            InspectionStatus status
    ) {

        switch (status) {
            case IN_PROGRESS:
                return start(id, null);

            case COMPLETED:
                return complete(id, null);

            case UNDER_REVIEW:
                return startReview(id);

            case APPROVED:
                return approve(id, null);

            case REJECTED:
                throw new BusinessException(
                        "A reprovação exige um motivo. Use POST /inspections/{id}/reject."
                );

            case CANCELLED:
                throw new BusinessException(
                        "O cancelamento exige uma justificativa. Use POST /inspections/{id}/cancel."
                );

            default:
                throw new BusinessException("Transição de status não permitida.");
        }
    }

    /** Técnico responsável inicia a execução (idempotente). */
    @Transactional
    public InspectionResponseDTO start(
            Long id,
            InspectionExecutionRequestDTO request
    ) {

        Inspection inspection = findInspection(id);
        User user = requireResponsibleTechnician(inspection);

        if (inspection.getStatus() == InspectionStatus.IN_PROGRESS) {
            return toResponseDTO(inspection);
        }

        requireStatus(inspection, InspectionStatus.SCHEDULED,
                "Somente inspeções agendadas podem ser iniciadas.");

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.IN_PROGRESS);
        inspection.setStartedAt(LocalDateTime.now());

        if (request != null) {
            inspection.setStartedAtDevice(toLocal(request.deviceTime()));
            inspection.setStartLatitude(request.latitude());
            inspection.setStartLongitude(request.longitude());
            inspection.setStartAccuracy(request.accuracy());
            inspection.setStartLocationAt(toLocal(request.locationTime()));
        }

        return saveTransition(inspection, previous, user, null);
    }

    /** Técnico responsável conclui a execução (idempotente). */
    @Transactional
    public InspectionResponseDTO complete(
            Long id,
            InspectionExecutionRequestDTO request
    ) {

        Inspection inspection = findInspection(id);
        User user = requireResponsibleTechnician(inspection);

        if (inspection.getStatus() == InspectionStatus.COMPLETED) {
            return toResponseDTO(inspection);
        }

        requireStatus(inspection, InspectionStatus.IN_PROGRESS,
                "Somente inspeções em andamento podem ser concluídas.");

        validateInspectionCompletion(inspection);

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.COMPLETED);
        inspection.setCompletedAt(LocalDateTime.now());

        if (request != null) {
            inspection.setCompletedAtDevice(toLocal(request.deviceTime()));
            inspection.setEndLatitude(request.latitude());
            inspection.setEndLongitude(request.longitude());
            inspection.setEndAccuracy(request.accuracy());
            inspection.setEndLocationAt(toLocal(request.locationTime()));
        }

        return saveTransition(inspection, previous, user, null);
    }

    /** Técnico responsável retoma uma inspeção reprovada para correção. */
    @Transactional
    public InspectionResponseDTO reopen(Long id) {

        Inspection inspection = findInspection(id);
        User user = requireResponsibleTechnician(inspection);

        if (inspection.getStatus() == InspectionStatus.IN_PROGRESS) {
            return toResponseDTO(inspection);
        }

        requireStatus(inspection, InspectionStatus.REJECTED,
                "Somente inspeções reprovadas podem ser reabertas para correção.");

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.IN_PROGRESS);
        inspection.setCompletedAt(null);
        inspection.setCompletedAtDevice(null);

        return saveTransition(
                inspection,
                previous,
                user,
                "Reaberta para correção. Motivo da reprovação anterior: "
                        + inspection.getReviewComment()
        );
    }

    /** Supervisor abre a revisão. */
    @Transactional
    public InspectionResponseDTO startReview(Long id) {

        Inspection inspection = findInspection(id);
        User user = requireSupervisor("iniciar a revisão");

        if (inspection.getStatus() == InspectionStatus.UNDER_REVIEW) {
            return toResponseDTO(inspection);
        }

        requireStatus(inspection, InspectionStatus.COMPLETED,
                "Somente inspeções concluídas podem entrar em revisão.");

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.UNDER_REVIEW);
        inspection.setReviewStartedAt(LocalDateTime.now());

        return saveTransition(inspection, previous, user, null);
    }

    /** Supervisor aprova (comentário opcional). */
    @Transactional
    public InspectionResponseDTO approve(Long id, String comment) {

        Inspection inspection = findInspection(id);
        User user = requireSupervisor("aprovar");

        requireStatus(inspection, InspectionStatus.UNDER_REVIEW,
                "A inspeção precisa estar em revisão para ser aprovada.");

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.APPROVED);
        inspection.setReviewedAt(LocalDateTime.now());
        inspection.setReviewedByName(user.getName());
        inspection.setReviewComment(blankToNull(comment));

        return saveTransition(inspection, previous, user, blankToNull(comment));
    }

    /** Supervisor reprova (motivo obrigatório, RN-080). */
    @Transactional
    public InspectionResponseDTO reject(Long id, String reason) {

        Inspection inspection = findInspection(id);
        User user = requireSupervisor("reprovar");

        String cleanReason = blankToNull(reason);

        if (cleanReason == null) {
            throw new BusinessException(
                    "O motivo da reprovação é obrigatório."
            );
        }

        requireStatus(inspection, InspectionStatus.UNDER_REVIEW,
                "A inspeção precisa estar em revisão para ser reprovada.");

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.REJECTED);
        inspection.setReviewedAt(LocalDateTime.now());
        inspection.setReviewedByName(user.getName());
        inspection.setReviewComment(cleanReason);

        return saveTransition(inspection, previous, user, cleanReason);
    }

    /** Administrador ou supervisor cancelam com justificativa (RN-029). */
    @Transactional
    public InspectionResponseDTO cancel(Long id, String reason) {

        Inspection inspection = findInspection(id);
        User user = getAuthenticatedUser();

        if (user.getRole() != Role.ADMIN
                && user.getRole() != Role.SUPERVISOR) {
            throw new AccessDeniedException(
                    "Somente administrador ou supervisor podem cancelar inspeções."
            );
        }

        String cleanReason = blankToNull(reason);

        if (cleanReason == null) {
            throw new BusinessException(
                    "A justificativa do cancelamento é obrigatória."
            );
        }

        if (inspection.getStatus() == InspectionStatus.APPROVED) {
            throw conflict(
                    "Uma inspeção aprovada não pode ser cancelada (RN-030)."
            );
        }

        if (inspection.getStatus() == InspectionStatus.CANCELLED) {
            throw conflict("A inspeção já está cancelada.");
        }

        InspectionStatus previous = inspection.getStatus();

        inspection.setStatus(InspectionStatus.CANCELLED);
        inspection.setCancelReason(cleanReason);
        inspection.setCancelledAt(LocalDateTime.now());
        inspection.setCancelledByName(user.getName());

        return saveTransition(inspection, previous, user, cleanReason);
    }

    private InspectionResponseDTO saveTransition(
            Inspection inspection,
            InspectionStatus previous,
            User user,
            String detail
    ) {

        Inspection updated = inspectionRepository.save(inspection);

        auditLogService.record(
                "STATUS_CHANGE",
                "Inspection",
                updated.getId(),
                "Status da inspeção alterado de "
                        + previous
                        + " para "
                        + updated.getStatus()
                        + " por " + user.getName()
                        + ". Inspeção: " + updated.getTitle()
                        + (detail == null ? "" : ". Detalhe: " + detail)
        );

        return toResponseDTO(updated);
    }

    // =========================================================
    // VALIDAÇÃO DA CONCLUSÃO (RN-037, RN-039, RN-055)
    // =========================================================

    private void validateInspectionCompletion(Inspection inspection) {

        Long templateVersionId = inspection.getTemplateVersion().getId();

        List<TemplateSection> sections = sectionRepository
                .findByTemplateVersionIdOrderByDisplayOrderAsc(
                        templateVersionId
                );

        for (TemplateSection section : sections) {

            List<TemplateItem> items = itemRepository
                    .findBySectionIdOrderByDisplayOrderAsc(
                            section.getId()
                    );

            for (TemplateItem item : items) {

                boolean required =
                        Boolean.TRUE.equals(item.getRequired());

                boolean requiresEvidence =
                        Boolean.TRUE.equals(item.getRequiresEvidence());

                boolean critical =
                        Boolean.TRUE.equals(item.getCriticalOnNonconformity());

                InspectionAnswer answer = answerRepository
                        .findByInspectionIdAndTemplateItemId(
                                inspection.getId(),
                                item.getId()
                        )
                        .orElse(null);

                if (answer == null) {

                    if (required || requiresEvidence) {
                        throw new BusinessException(
                                "O item obrigatório não foi respondido: "
                                        + item.getLabel()
                        );
                    }

                    continue;
                }

                boolean nonConform =
                        AnswerContract.isNonConformity(answer.getValue());

                boolean evidenceNeeded =
                        requiresEvidence || (critical && nonConform);

                if (evidenceNeeded
                        && !evidenceRepository
                                .existsByInspectionAnswerId(answer.getId())) {

                    throw new BusinessException(
                            "O item exige evidência, mas nenhuma evidência foi enviada: "
                                    + item.getLabel()
                    );
                }
            }
        }

        // RN-055: não conformidade crítica exige descrição e evidência.
        for (NonConformity nonConformity :
                nonConformityRepository
                        .findByInspectionIdOrderByCreatedAtAsc(
                                inspection.getId()
                        )) {

            if (nonConformity.getSeverity()
                    == NonConformitySeverity.CRITICAL
                    && evidenceRepository
                            .findByNonConformityId(nonConformity.getId())
                            .isEmpty()) {

                throw new BusinessException(
                        "A não conformidade crítica exige ao menos uma evidência: "
                                + nonConformity.getDescription()
                );
            }
        }
    }

    // =========================================================
    // AUTORIZAÇÃO
    // =========================================================

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User user)) {

            throw new AccessDeniedException("Usuário não autenticado.");
        }

        return user;
    }

    private User requireResponsibleTechnician(Inspection inspection) {

        User user = getAuthenticatedUser();

        if (user.getRole() != Role.TECHNICIAN) {
            throw new AccessDeniedException(
                    "Somente o técnico responsável pode executar esta ação."
            );
        }

        if (!inspection.getTechnician().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "Somente o técnico responsável pela inspeção pode executar esta ação."
            );
        }

        return user;
    }

    private User requireSupervisor(String action) {

        User user = getAuthenticatedUser();

        if (user.getRole() != Role.SUPERVISOR) {
            throw new AccessDeniedException(
                    "Somente o supervisor pode " + action + " a inspeção."
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
    // AUXILIARES
    // =========================================================

    private Inspection findInspection(Long id) {

        return inspectionRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Inspeção não encontrada."
                ));
    }

    private void requireStatus(
            Inspection inspection,
            InspectionStatus expected,
            String message
    ) {

        if (inspection.getStatus() != expected) {
            throw conflict(
                    message + " Status atual: " + inspection.getStatus() + "."
            );
        }
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private String blankToNull(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private LocalDateTime toLocal(OffsetDateTime value) {

        if (value == null) {
            return null;
        }

        return value.atZoneSameInstant(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    // =========================================================
    // CONVERSÃO PARA DTO
    // =========================================================

    private InspectionResponseDTO toResponseDTO(Inspection inspection) {

        InspectionResponseDTO dto = new InspectionResponseDTO();

        dto.setId(inspection.getId());
        dto.setTitle(inspection.getTitle());
        dto.setInstructions(inspection.getInstructions());

        dto.setTemplateVersionId(inspection.getTemplateVersion().getId());
        dto.setClientId(inspection.getClient().getId());
        dto.setSiteId(inspection.getSite().getId());
        dto.setEquipmentId(inspection.getEquipment().getId());
        dto.setTechnicianId(inspection.getTechnician().getId());

        dto.setClientName(inspection.getClient().getName());
        dto.setSiteName(inspection.getSite().getName());
        dto.setEquipmentName(inspection.getEquipment().getName());
        dto.setEquipmentQrCode(inspection.getEquipment().getQrCode());
        dto.setTechnicianName(inspection.getTechnician().getName());

        dto.setScheduledDate(inspection.getScheduledDate());
        dto.setScheduledTime(inspection.getScheduledTime());
        dto.setPriority(inspection.getPriority());
        dto.setStatus(inspection.getStatus());

        dto.setStartedAt(inspection.getStartedAt());
        dto.setStartedAtDevice(inspection.getStartedAtDevice());
        dto.setCompletedAt(inspection.getCompletedAt());
        dto.setCompletedAtDevice(inspection.getCompletedAtDevice());

        dto.setStartLatitude(inspection.getStartLatitude());
        dto.setStartLongitude(inspection.getStartLongitude());
        dto.setStartAccuracy(inspection.getStartAccuracy());
        dto.setStartLocationAt(inspection.getStartLocationAt());
        dto.setEndLatitude(inspection.getEndLatitude());
        dto.setEndLongitude(inspection.getEndLongitude());
        dto.setEndAccuracy(inspection.getEndAccuracy());
        dto.setEndLocationAt(inspection.getEndLocationAt());

        dto.setCancelReason(inspection.getCancelReason());
        dto.setCancelledAt(inspection.getCancelledAt());
        dto.setCancelledByName(inspection.getCancelledByName());

        dto.setReviewStartedAt(inspection.getReviewStartedAt());
        dto.setReviewedAt(inspection.getReviewedAt());
        dto.setReviewedByName(inspection.getReviewedByName());
        dto.setReviewComment(inspection.getReviewComment());

        dto.setCreatedAt(inspection.getCreatedAt());
        dto.setUpdatedAt(inspection.getUpdatedAt());

        return dto;
    }
}
