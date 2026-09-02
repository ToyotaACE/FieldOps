package com.fieldops.fieldops_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fieldops.fieldops_api.entities.InspectionTemplateVersion;

@Repository
public interface InspectionTemplateVersionRepository
        extends JpaRepository<InspectionTemplateVersion, Long> {

    List<InspectionTemplateVersion> findByTemplateIdOrderByVersionNumberAsc(Long templateId);

    Optional<InspectionTemplateVersion>
            findTopByTemplateIdOrderByVersionNumberDesc(Long templateId);

    Optional<InspectionTemplateVersion>
            findByTemplateIdAndPublishedTrue(Long templateId);
}