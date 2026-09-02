package com.fieldops.fieldops_api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fieldops.fieldops_api.entities.TemplateSection;

@Repository
public interface TemplateSectionRepository
        extends JpaRepository<TemplateSection, Long> {

    List<TemplateSection>
            findByTemplateVersionIdOrderByDisplayOrderAsc(
                    Long templateVersionId);

    boolean existsByTemplateVersionId(Long templateVersionId);

    boolean existsByTemplateVersionIdAndDisplayOrder(
            Long templateVersionId,
            Integer displayOrder);
}