package com.fieldops.fieldops_api.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.AuditLogResponseDTO;
import com.fieldops.fieldops_api.dto.InspectionAnswerResponseDTO;
import com.fieldops.fieldops_api.dto.InspectionEvidenceResponseDTO;
import com.fieldops.fieldops_api.dto.InspectionPackageDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.dto.NonConformityResponseDTO;
import com.fieldops.fieldops_api.dto.TemplateItemResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionAnswer;
import com.fieldops.fieldops_api.entities.InspectionEvidence;
import com.fieldops.fieldops_api.entities.NonConformity;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.TemplateSection;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionEvidenceRepository;
import com.fieldops.fieldops_api.repositories.NonConformityRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;

@Service
public class InspectionPackageService {

    private final InspectionService inspectionService;
    private final TemplateSectionRepository sectionRepository;
    private final TemplateItemRepository itemRepository;
    private final InspectionAnswerRepository answerRepository;
    private final InspectionEvidenceRepository evidenceRepository;
    private final NonConformityRepository nonConformityRepository;
    private final NonConformityService nonConformityService;
    private final AuditLogService auditLogService;

    public InspectionPackageService(
            InspectionService inspectionService,
            TemplateSectionRepository sectionRepository,
            TemplateItemRepository itemRepository,
            InspectionAnswerRepository answerRepository,
            InspectionEvidenceRepository evidenceRepository,
            NonConformityRepository nonConformityRepository,
            NonConformityService nonConformityService,
            AuditLogService auditLogService) {

        this.inspectionService = inspectionService;
        this.sectionRepository = sectionRepository;
        this.itemRepository = itemRepository;
        this.answerRepository = answerRepository;
        this.evidenceRepository = evidenceRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.nonConformityService = nonConformityService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public InspectionPackageDTO build(Long inspectionId) {

        // Valida o acesso: o técnico só enxerga as próprias inspeções.
        InspectionResponseDTO inspection =
                inspectionService.findById(inspectionId);

        List<InspectionPackageDTO.Section> sections = new ArrayList<>();

        for (TemplateSection section : sectionRepository
                .findByTemplateVersionIdOrderByDisplayOrderAsc(
                        inspection.getTemplateVersionId())) {

            List<TemplateItemResponseDTO> items = new ArrayList<>();

            for (TemplateItem item : itemRepository
                    .findBySectionIdOrderByDisplayOrderAsc(
                            section.getId())) {

                items.add(toItemDto(item, section.getId()));
            }

            sections.add(new InspectionPackageDTO.Section(
                    section.getId(),
                    section.getTitle(),
                    section.getDescription(),
                    section.getDisplayOrder(),
                    items
            ));
        }

        List<InspectionAnswerResponseDTO> answers = new ArrayList<>();
        List<InspectionEvidenceResponseDTO> evidences = new ArrayList<>();

        for (InspectionAnswer answer :
                answerRepository.findByInspectionId(inspectionId)) {

            InspectionAnswerResponseDTO dto =
                    new InspectionAnswerResponseDTO();

            dto.setId(answer.getId());
            dto.setInspectionId(inspectionId);
            dto.setTemplateItemId(answer.getTemplateItem().getId());
            dto.setValue(answer.getValue());
            dto.setObservation(answer.getObservation());
            dto.setCreatedAt(answer.getCreatedAt());
            dto.setUpdatedAt(answer.getUpdatedAt());

            answers.add(dto);

            for (InspectionEvidence evidence :
                    evidenceRepository.findByInspectionAnswerId(
                            answer.getId())) {

                evidences.add(toEvidenceDto(evidence, answer.getId(), null));
            }
        }

        List<NonConformityResponseDTO> nonConformities =
                new ArrayList<>();

        for (NonConformity nonConformity :
                nonConformityRepository
                        .findByInspectionIdOrderByCreatedAtAsc(
                                inspectionId)) {

            nonConformities.add(nonConformityService.toDto(nonConformity));

            for (InspectionEvidence evidence :
                    evidenceRepository.findByNonConformityId(
                            nonConformity.getId())) {

                evidences.add(
                        toEvidenceDto(evidence, null, nonConformity.getId())
                );
            }
        }

        List<AuditLogResponseDTO> history =
                auditLogService.findByEntity(
                        "Inspection",
                        String.valueOf(inspectionId)
                );

        return new InspectionPackageDTO(
                inspection,
                sections,
                answers,
                evidences,
                nonConformities,
                history
        );
    }

    private TemplateItemResponseDTO toItemDto(
            TemplateItem item,
            Long sectionId) {

        return new TemplateItemResponseDTO(
                item.getId(),
                sectionId,
                item.getLabel(),
                item.getDescription(),
                item.getResponseType(),
                item.getRequired(),
                item.getRequiresObservationOnNonconformity(),
                item.getCriticalOnNonconformity(),
                item.getRequiresEvidence(),
                item.getDisplayOrder(),
                item.getCreatedAt(),
                AnswerContract.splitOptions(item.getOptions())
        );
    }

    private InspectionEvidenceResponseDTO toEvidenceDto(
            InspectionEvidence evidence,
            Long answerId,
            Long nonConformityId) {

        return new InspectionEvidenceResponseDTO(
                evidence.getId(),
                answerId,
                evidence.getOriginalFilename(),
                evidence.getContentType(),
                evidence.getUploadedAt(),
                nonConformityId
        );
    }
}
