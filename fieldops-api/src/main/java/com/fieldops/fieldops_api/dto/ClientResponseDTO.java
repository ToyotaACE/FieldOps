package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record ClientResponseDTO(

    Long id,
    String name,
    String document,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {
}