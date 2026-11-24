package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record TemplateSectionResponseDTO(

    Long id,
    Long templateVersionId,
    String title,
    String description,
    Integer displayOrder,
    LocalDateTime createdAt

) {
}