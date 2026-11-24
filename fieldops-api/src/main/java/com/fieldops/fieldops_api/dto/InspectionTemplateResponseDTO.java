package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record InspectionTemplateResponseDTO(

    Long id,
    String title,
    String category,
    String description,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {
}