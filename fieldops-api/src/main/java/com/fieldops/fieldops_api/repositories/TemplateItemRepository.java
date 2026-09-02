package com.fieldops.fieldops_api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fieldops.fieldops_api.entities.TemplateItem;

@Repository
public interface TemplateItemRepository
        extends JpaRepository<TemplateItem, Long> {

    List<TemplateItem>
            findBySectionIdOrderByDisplayOrderAsc(Long sectionId);

    boolean existsBySectionId(Long sectionId);

    boolean existsBySectionIdAndDisplayOrder(
            Long sectionId,
            Integer displayOrder);
}