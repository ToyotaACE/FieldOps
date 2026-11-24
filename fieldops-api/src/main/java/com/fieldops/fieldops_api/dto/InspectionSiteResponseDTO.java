package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record InspectionSiteResponseDTO(

    Long id,
    String name,
    String address,
    String city,
    String state,
    Boolean active,

    Long clientId,
    String clientName,

    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {
}