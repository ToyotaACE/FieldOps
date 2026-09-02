package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

import com.fieldops.fieldops_api.entities.ResponseType;

public record TemplateItemResponseDTO(

    Long id,
    Long sectionId,
    String label,
    String description,
    ResponseType responseType,
    Boolean required,
    Boolean requiresObservationOnNonconformity,
    Boolean criticalOnNonconformity,
    Integer displayOrder,
    LocalDateTime createdAt

) {
}