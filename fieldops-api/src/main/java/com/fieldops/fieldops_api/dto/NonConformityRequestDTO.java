package com.fieldops.fieldops_api.dto;

import com.fieldops.fieldops_api.entities.NonConformitySeverity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NonConformityRequestDTO(

    // Item do checklist relacionado (opcional, RN-053)
    Long templateItemId,

    @NotNull(message = "A criticidade é obrigatória")
    NonConformitySeverity severity,

    @Size(max = 100)
    String type,

    @NotBlank(message = "A descrição é obrigatória")
    @Size(max = 4000)
    String description,

    @Size(max = 4000)
    String probableCause,

    @Size(max = 4000)
    String recommendedAction,

    @Size(max = 4000)
    String technicalNotes,

    // UUID gerado no dispositivo (idempotência)
    @Size(max = 64)
    String clientOperationId
) {
}
