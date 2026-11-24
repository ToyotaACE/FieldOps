package com.fieldops.fieldops_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fieldops.fieldops_api.entities.InspectionEvidence;

public interface InspectionEvidenceRepository
        extends JpaRepository<InspectionEvidence, Long> {

    List<InspectionEvidence> findByInspectionAnswerId(Long answerId);

    List<InspectionEvidence> findByNonConformityId(Long nonConformityId);

    boolean existsByInspectionAnswerId(Long answerId);

    Optional<InspectionEvidence> findByClientOperationId(String clientOperationId);
}