package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.TemplateItemRequestDTO;
import com.fieldops.fieldops_api.dto.TemplateItemResponseDTO;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.TemplateSection;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;

@Service
@Transactional(readOnly = true)
public class TemplateItemService {

    private final TemplateItemRepository itemRepository;
    private final TemplateSectionRepository sectionRepository;

    public TemplateItemService(
            TemplateItemRepository itemRepository,
            TemplateSectionRepository sectionRepository) {

        this.itemRepository = itemRepository;
        this.sectionRepository = sectionRepository;
    }

    public List<TemplateItemResponseDTO> findBySectionId(
            Long sectionId) {

        findSection(sectionId);

        return itemRepository
                .findBySectionIdOrderByDisplayOrderAsc(sectionId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public TemplateItemResponseDTO findById(Long id) {

        TemplateItem item = findItem(id);

        return toResponseDTO(item);
    }

    @Transactional
    public TemplateItemResponseDTO create(
            Long sectionId,
            TemplateItemRequestDTO dto) {

        TemplateSection section = findSection(sectionId);

        validateDraft(section);

        TemplateItem item = new TemplateItem();

        item.setSection(section);
        item.setLabel(dto.label());
        item.setDescription(dto.description());
        item.setResponseType(dto.responseType());

        item.setRequired(
                Boolean.TRUE.equals(dto.required())
        );

        item.setRequiresObservationOnNonconformity(
                Boolean.TRUE.equals(
                        dto.requiresObservationOnNonconformity()
                )
        );

        item.setCriticalOnNonconformity(
                Boolean.TRUE.equals(
                        dto.criticalOnNonconformity()
                )
        );

        item.setDisplayOrder(dto.displayOrder());

        item = itemRepository.save(item);

        return toResponseDTO(item);
    }

    @Transactional
    public TemplateItemResponseDTO update(
            Long id,
            TemplateItemRequestDTO dto) {

        TemplateItem item = findItem(id);

        validateDraft(item.getSection());

        item.setLabel(dto.label());
        item.setDescription(dto.description());
        item.setResponseType(dto.responseType());

        item.setRequired(
                Boolean.TRUE.equals(dto.required())
        );

        item.setRequiresObservationOnNonconformity(
                Boolean.TRUE.equals(
                        dto.requiresObservationOnNonconformity()
                )
        );

        item.setCriticalOnNonconformity(
                Boolean.TRUE.equals(
                        dto.criticalOnNonconformity()
                )
        );

        item.setDisplayOrder(dto.displayOrder());

        item = itemRepository.save(item);

        return toResponseDTO(item);
    }

    @Transactional
    public void delete(Long id) {

        TemplateItem item = findItem(id);

        validateDraft(item.getSection());

        itemRepository.delete(item);
    }

    private TemplateItem findItem(Long id) {

        return itemRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Item do modelo não encontrado"
                        ));
    }

    private TemplateSection findSection(Long id) {

        return sectionRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Seção do modelo não encontrada"
                        ));
    }

    private void validateDraft(TemplateSection section) {

        if (Boolean.TRUE.equals(
                section.getTemplateVersion().getPublished())) {

            throw new BusinessException(
                    "Não é possível alterar itens de uma versão publicada"
            );
        }

        if (!section.getTemplateVersion()
                .getTemplate()
                .getActive()) {

            throw new BusinessException(
                    "Não é possível alterar um modelo inativo"
            );
        }
    }

    private TemplateItemResponseDTO toResponseDTO(
            TemplateItem item) {

        return new TemplateItemResponseDTO(
                item.getId(),
                item.getSection().getId(),
                item.getLabel(),
                item.getDescription(),
                item.getResponseType(),
                item.getRequired(),
                item.getRequiresObservationOnNonconformity(),
                item.getCriticalOnNonconformity(),
                item.getDisplayOrder(),
                item.getCreatedAt()
        );
    }
}