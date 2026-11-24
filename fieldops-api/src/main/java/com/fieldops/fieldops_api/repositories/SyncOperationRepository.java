package com.fieldops.fieldops_api.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fieldops.fieldops_api.entities.SyncOperation;

public interface SyncOperationRepository
        extends JpaRepository<SyncOperation, Long> {

    Optional<SyncOperation> findByOperationId(String operationId);
}