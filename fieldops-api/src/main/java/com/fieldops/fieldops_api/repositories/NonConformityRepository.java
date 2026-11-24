package com.fieldops.fieldops_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fieldops.fieldops_api.entities.NonConformity;

public interface NonConformityRepository
        extends JpaRepository<NonConformity, Long> {

    List<NonConformity> findByInspectionIdOrderByCreatedAtAsc(Long inspectionId);

    Optional<NonConformity> findByClientOperationId(String clientOperationId);
}