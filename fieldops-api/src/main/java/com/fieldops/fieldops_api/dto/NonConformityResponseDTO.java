package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

import com.fieldops.fieldops_api.entities.NonConformitySeverity;
import com.fieldops.fieldops_api.entities.NonConformityStatus;

public record NonConformityResponseDTO(
    Long id,
    Long inspectionId,
    Long templateItemId,
    NonConformitySeverity severity,
    NonConformityStatus status,
    String type,
    String description,
    String probableCause,
    String recommendedAction,
    String technicalNotes,
    String createdByName,
    String clientOperationId,
    LocalDateTime createdAt
) {
}
