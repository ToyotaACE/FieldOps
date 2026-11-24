package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record EquipmentResponseDTO(

    Long id,
    String name,
    String category,
    String serialNumber,
    String qrCode,
    Boolean active,

    Long siteId,
    String siteName,

    Long clientId,
    String clientName,

    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {
}