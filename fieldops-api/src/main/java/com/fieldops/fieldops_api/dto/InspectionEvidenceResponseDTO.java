package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record InspectionEvidenceResponseDTO(
        Long id,
        Long answerId,
        String originalFilename,
        String contentType,
        LocalDateTime uploadedAt
) {
}