package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.Size;

/**
 * Justificativa de cancelamento, motivo de reprovação ou comentário de
 * aprovação.
 */
public record InspectionReasonRequestDTO(
    @Size(max = 2000)
    String reason
) {
}
