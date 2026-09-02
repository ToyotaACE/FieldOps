package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.TemplateSectionRequestDTO;
import com.fieldops.fieldops_api.dto.TemplateSectionResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionTemplateVersion;
import com.fieldops.fieldops_api.entities.TemplateSection;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;

@Service
@Transactional(readOnly = true)
public class TemplateSectionService {

    private final TemplateSectionRepository sectionRepository;
    private final InspectionTemplateVersionRepository versionRepository;

    public TemplateSectionService(
            TemplateSectionRepository sectionRepository,
            InspectionTemplateVersionRepository versionRepository) {

        this.sectionRepository = sectionRepository;
        this.versionRepository = versionRepository;
    }

    public List<TemplateSectionResponseDTO> findByVersionId(
            Long versionId) {

        findVersion(versionId);

        return sectionRepository
                .findByTemplateVersionIdOrderByDisplayOrderAsc(versionId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public TemplateSectionResponseDTO findById(Long id) {

        TemplateSection section = findSection(id);

        return toResponseDTO(section);
    }

    @Transactional
    public TemplateSectionResponseDTO create(
            Long versionId,
            TemplateSectionRequestDTO dto) {

        InspectionTemplateVersion version = findVersion(versionId);

        validateDraft(version);

        TemplateSection section = new TemplateSection();

        section.setTemplateVersion(version);
        section.setTitle(dto.title());
        section.setDescription(dto.description());
        section.setDisplayOrder(dto.displayOrder());

        section = sectionRepository.save(section);

        return toResponseDTO(section);
    }

    @Transactional
    public TemplateSectionResponseDTO update(
            Long id,
            TemplateSectionRequestDTO dto) {

        TemplateSection section = findSection(id);

        validateDraft(section.getTemplateVersion());

        section.setTitle(dto.title());
        section.setDescription(dto.description());
        section.setDisplayOrder(dto.displayOrder());

        section = sectionRepository.save(section);

        return toResponseDTO(section);
    }

    @Transactional
    public void delete(Long id) {

        TemplateSection section = findSection(id);

        validateDraft(section.getTemplateVersion());

        sectionRepository.delete(section);
    }

    private TemplateSection findSection(Long id) {

        return sectionRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Seção do modelo não encontrada"
                        ));
    }

    private InspectionTemplateVersion findVersion(Long id) {

        return versionRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Versão do modelo não encontrada"
                        ));
    }

    private void validateDraft(
            InspectionTemplateVersion version) {

        if (Boolean.TRUE.equals(version.getPublished())) {
            throw new BusinessException(
                    "Não é possível alterar uma versão publicada"
            );
        }

        if (!version.getTemplate().getActive()) {
            throw new BusinessException(
                    "Não é possível alterar um modelo inativo"
            );
        }
    }

    private TemplateSectionResponseDTO toResponseDTO(
            TemplateSection section) {

        return new TemplateSectionResponseDTO(
                section.getId(),
                section.getTemplateVersion().getId(),
                section.getTitle(),
                section.getDescription(),
                section.getDisplayOrder(),
                section.getCreatedAt()
        );
    }
}