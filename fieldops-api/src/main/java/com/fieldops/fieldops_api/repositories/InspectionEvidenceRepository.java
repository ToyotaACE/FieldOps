package com.fieldops.fieldops_api.repositories;

import com.fieldops.fieldops_api.entities.InspectionEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InspectionEvidenceRepository
        extends JpaRepository<InspectionEvidence, Long> {

    List<InspectionEvidence> findByInspectionAnswerId(Long answerId);

    boolean existsByInspectionAnswerId(Long answerId);
}