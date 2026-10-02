package com.fieldops.fieldops_api.repositories;

import com.fieldops.fieldops_api.entities.InspectionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InspectionAnswerRepository
        extends JpaRepository<InspectionAnswer, Long> {

    List<InspectionAnswer> findByInspectionId(Long inspectionId);

    Optional<InspectionAnswer> findByInspectionIdAndTemplateItemId(
            Long inspectionId,
            Long templateItemId
    );

    boolean existsByInspectionIdAndTemplateItemId(
            Long inspectionId,
            Long templateItemId
    );
}