package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.InspectionTemplateRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionTemplateResponseDTO;
import com.fieldops.fieldops_api.dto.InspectionTemplateVersionResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionTemplate;
import com.fieldops.fieldops_api.entities.InspectionTemplateVersion;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.InspectionTemplateRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;

@Service
@Transactional(readOnly = true)
public class InspectionTemplateService {

    private final InspectionTemplateRepository templateRepository;
    private final InspectionTemplateVersionRepository versionRepository;

    public InspectionTemplateService(
            InspectionTemplateRepository templateRepository,
            InspectionTemplateVersionRepository versionRepository) {

        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
    }

    public List<InspectionTemplateResponseDTO> findAll() {

        return templateRepository.findAll()
                .stream()
                .map(this::toTemplateResponseDTO)
                .toList();
    }

    public InspectionTemplateResponseDTO findById(Long id) {

        InspectionTemplate template = findTemplate(id);

        return toTemplateResponseDTO(template);
    }

    public List<InspectionTemplateVersionResponseDTO> findVersions(
            Long templateId) {

        findTemplate(templateId);

        return versionRepository
                .findByTemplateIdOrderByVersionNumberAsc(templateId)
                .stream()
                .map(this::toVersionResponseDTO)
                .toList();
    }

    @Transactional
    public InspectionTemplateResponseDTO create(
            InspectionTemplateRequestDTO dto) {

        InspectionTemplate template = new InspectionTemplate();

        template.setTitle(dto.title());
        template.setCategory(dto.category());
        template.setDescription(dto.description());
        template.setActive(true);

        template = templateRepository.save(template);

        // Todo modelo novo começa com a versão 1 em rascunho.
        InspectionTemplateVersion version =
                new InspectionTemplateVersion();

        version.setTemplate(template);
        version.setVersionNumber(1);
        version.setPublished(false);

        versionRepository.save(version);

        return toTemplateResponseDTO(template);
    }

    @Transactional
    public InspectionTemplateResponseDTO update(
            Long id,
            InspectionTemplateRequestDTO dto) {

        InspectionTemplate template = findTemplate(id);

        if (!template.getActive()) {
            throw new BusinessException(
                    "Não é possível editar um modelo inativo"
            );
        }

        template.setTitle(dto.title());
        template.setCategory(dto.category());
        template.setDescription(dto.description());

        template = templateRepository.save(template);

        return toTemplateResponseDTO(template);
    }

    @Transactional
    public InspectionTemplateResponseDTO deactivate(Long id) {

        InspectionTemplate template = findTemplate(id);

        template.setActive(false);

        template = templateRepository.save(template);

        return toTemplateResponseDTO(template);
    }

    @Transactional
    public InspectionTemplateResponseDTO activate(Long id) {

        InspectionTemplate template = findTemplate(id);

        template.setActive(true);

        template = templateRepository.save(template);

        return toTemplateResponseDTO(template);
    }

    private InspectionTemplate findTemplate(Long id) {

        return templateRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Modelo de inspeção não encontrado"
                        ));
    }

    private InspectionTemplateResponseDTO toTemplateResponseDTO(
            InspectionTemplate template) {

        return new InspectionTemplateResponseDTO(
                template.getId(),
                template.getTitle(),
                template.getCategory(),
                template.getDescription(),
                template.getActive(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }

    private InspectionTemplateVersionResponseDTO toVersionResponseDTO(
            InspectionTemplateVersion version) {

        return new InspectionTemplateVersionResponseDTO(
                version.getId(),
                version.getTemplate().getId(),
                version.getVersionNumber(),
                version.getPublished(),
                version.getPublishedAt(),
                version.getCreatedAt()
        );
    }
}