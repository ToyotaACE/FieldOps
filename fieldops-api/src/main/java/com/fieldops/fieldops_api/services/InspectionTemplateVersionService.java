package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.InspectionTemplateVersionResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionTemplate;
import com.fieldops.fieldops_api.entities.InspectionTemplateVersion;
import com.fieldops.fieldops_api.entities.TemplateItem;
import com.fieldops.fieldops_api.entities.TemplateSection;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.InspectionTemplateRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;
import com.fieldops.fieldops_api.repositories.TemplateItemRepository;
import com.fieldops.fieldops_api.repositories.TemplateSectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class InspectionTemplateVersionService {

    private final InspectionTemplateVersionRepository versionRepository;
    private final InspectionTemplateRepository templateRepository;
    private final TemplateSectionRepository sectionRepository;
    private final TemplateItemRepository itemRepository;

    public InspectionTemplateVersionService(
            InspectionTemplateVersionRepository versionRepository,
            InspectionTemplateRepository templateRepository,
            TemplateSectionRepository sectionRepository,
            TemplateItemRepository itemRepository) {

        this.versionRepository = versionRepository;
        this.templateRepository = templateRepository;
        this.sectionRepository = sectionRepository;
        this.itemRepository = itemRepository;
    }

    public InspectionTemplateVersionResponseDTO findById(Long id) {

        InspectionTemplateVersion version = findVersion(id);

        return toResponseDTO(version);
    }

    /**
     * Cria uma nova versão a partir da última versão publicada.
     *
     * A versão anterior permanece publicada e imutável.
     * A nova versão começa como rascunho.
     */
    @Transactional
    public InspectionTemplateVersionResponseDTO createNewVersion(Long templateId) {

        InspectionTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() ->
                        new BusinessException("Modelo de inspeção não encontrado"));

        if (!Boolean.TRUE.equals(template.getActive())) {
            throw new BusinessException(
                    "Não é possível criar uma versão de um modelo inativo"
            );
        }

        InspectionTemplateVersion latestVersion =
                versionRepository
                        .findTopByTemplateIdOrderByVersionNumberDesc(templateId)
                        .orElseThrow(() ->
                                new BusinessException(
                                        "Nenhuma versão encontrada para o modelo"
                                )
                        );

        /*
         * Só podemos criar uma nova versão quando a versão atual
         * estiver publicada.
         *
         * A versão publicada NÃO será alterada.
         */
        if (!Boolean.TRUE.equals(latestVersion.getPublished())) {
            throw new BusinessException(
                    "A versão atual ainda está em rascunho. " +
                    "Publique a versão atual antes de criar uma nova."
            );
        }

        Integer newVersionNumber =
                latestVersion.getVersionNumber() + 1;

        /*
         * Cria a nova versão como rascunho.
         */
        InspectionTemplateVersion newVersion =
                new InspectionTemplateVersion();

        newVersion.setTemplate(template);
        newVersion.setVersionNumber(newVersionNumber);
        newVersion.setPublished(false);
        newVersion.setPublishedAt(null);

        newVersion = versionRepository.save(newVersion);

        /*
         * Busca todas as seções da versão publicada.
         */
        List<TemplateSection> oldSections =
                sectionRepository
                        .findByTemplateVersionIdOrderByDisplayOrderAsc(
                                latestVersion.getId()
                        );

        /*
         * Copia cada seção para a nova versão.
         */
        for (TemplateSection oldSection : oldSections) {

            TemplateSection newSection =
                    new TemplateSection();

            newSection.setTemplateVersion(newVersion);
            newSection.setTitle(oldSection.getTitle());
            newSection.setDescription(oldSection.getDescription());
            newSection.setDisplayOrder(oldSection.getDisplayOrder());

            newSection =
                    sectionRepository.save(newSection);

            /*
             * Busca os itens da seção antiga.
             */
            List<TemplateItem> oldItems =
                    itemRepository
                            .findBySectionIdOrderByDisplayOrderAsc(
                                    oldSection.getId()
                            );

            /*
             * Copia cada item para a nova seção.
             */
            for (TemplateItem oldItem : oldItems) {

                TemplateItem newItem =
                        new TemplateItem();

                newItem.setSection(newSection);
                newItem.setLabel(oldItem.getLabel());
                newItem.setDescription(oldItem.getDescription());
                newItem.setResponseType(oldItem.getResponseType());
                newItem.setRequired(oldItem.getRequired());

                newItem.setRequiresObservationOnNonconformity(
                        oldItem.getRequiresObservationOnNonconformity()
                );

                newItem.setCriticalOnNonconformity(
                        oldItem.getCriticalOnNonconformity()
                );

                newItem.setDisplayOrder(
                        oldItem.getDisplayOrder()
                );

                itemRepository.save(newItem);
            }
        }

        return toResponseDTO(newVersion);
    }

    /**
     * Publica uma versão de modelo.
     *
     * Antes da publicação são verificadas:
     * - modelo ativo;
     * - existência de seção;
     * - ordem das seções;
     * - existência de itens;
     * - ordem dos itens;
     * - tipo de resposta dos itens.
     */
    @Transactional
    public InspectionTemplateVersionResponseDTO publish(Long versionId) {

        InspectionTemplateVersion version =
                findVersion(versionId);

        if (Boolean.TRUE.equals(version.getPublished())) {
            throw new BusinessException(
                    "A versão já está publicada"
            );
        }

        InspectionTemplate template =
                version.getTemplate();

        if (!Boolean.TRUE.equals(template.getActive())) {
            throw new BusinessException(
                    "Não é possível publicar uma versão de um modelo inativo"
            );
        }

        List<TemplateSection> sections =
                sectionRepository
                        .findByTemplateVersionIdOrderByDisplayOrderAsc(
                                version.getId()
                        );

        /*
         * O modelo precisa possuir pelo menos uma seção.
         */
        if (sections.isEmpty()) {
            throw new BusinessException(
                    "A versão precisa possuir pelo menos uma seção"
            );
        }

        /*
         * Verifica se as ordens das seções são válidas.
         */
        Set<Integer> sectionOrders =
                new HashSet<>();

        for (TemplateSection section : sections) {

            if (section.getDisplayOrder() == null ||
                    section.getDisplayOrder() <= 0) {

                throw new BusinessException(
                        "A ordem da seção deve ser maior que zero"
                );
            }

            if (!sectionOrders.add(
                    section.getDisplayOrder())) {

                throw new BusinessException(
                        "Existem seções com a mesma ordem"
                );
            }

            /*
             * Cada seção precisa possuir pelo menos um item.
             */
            List<TemplateItem> items =
                    itemRepository
                            .findBySectionIdOrderByDisplayOrderAsc(
                                    section.getId()
                            );

            if (items.isEmpty()) {
                throw new BusinessException(
                        "A seção '" +
                        section.getTitle() +
                        "' precisa possuir pelo menos um item"
                );
            }

            /*
             * Verifica os itens da seção.
             */
            Set<Integer> itemOrders =
                    new HashSet<>();

            for (TemplateItem item : items) {

                /*
                 * Todo item precisa possuir tipo de resposta.
                 */
                if (item.getResponseType() == null) {
                    throw new BusinessException(
                            "O item '" +
                            item.getLabel() +
                            "' precisa possuir um tipo de resposta"
                    );
                }

                /*
                 * A ordem do item deve ser maior que zero.
                 */
                if (item.getDisplayOrder() == null ||
                        item.getDisplayOrder() <= 0) {

                    throw new BusinessException(
                            "A ordem do item '" +
                            item.getLabel() +
                            "' deve ser maior que zero"
                    );
                }

                /*
                 * Não pode existir dois itens com
                 * a mesma ordem dentro da seção.
                 */
                if (!itemOrders.add(
                        item.getDisplayOrder())) {

                    throw new BusinessException(
                            "Existem itens com a mesma ordem na seção '" +
                            section.getTitle() +
                            "'"
                    );
                }
            }
        }

        /*
         * Todas as validações passaram.
         * A versão pode ser publicada.
         */
        version.setPublished(true);
        version.setPublishedAt(LocalDateTime.now());

        version =
                versionRepository.save(version);

        return toResponseDTO(version);
    }

    /**
     * Busca uma versão pelo ID.
     */
    private InspectionTemplateVersion findVersion(Long id) {

        return versionRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException(
                                "Versão do modelo não encontrada"
                        )
                );
    }

    /**
     * Converte a entidade para DTO.
     */
    private InspectionTemplateVersionResponseDTO toResponseDTO(
            InspectionTemplateVersion version) {

        InspectionTemplateVersionResponseDTO dto =
                new InspectionTemplateVersionResponseDTO();

        dto.setId(version.getId());
        dto.setTemplateId(
                version.getTemplate().getId()
        );
        dto.setVersionNumber(
                version.getVersionNumber()
        );
        dto.setPublished(
                version.getPublished()
        );
        dto.setPublishedAt(
                version.getPublishedAt()
        );
        dto.setCreatedAt(
                version.getCreatedAt()
        );

        return dto;
    }
}