package com.fieldops.fieldops_api.dto;

import com.fieldops.fieldops_api.entities.ResponseType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TemplateItemRequestDTO(

    @NotBlank(message = "O texto do item é obrigatório")
    @Size(max = 300)
    String label,

    @Size(max = 500)
    String description,

    @NotNull(message = "O tipo de resposta é obrigatório")
    ResponseType responseType,

    Boolean required,

    Boolean requiresObservationOnNonconformity,

    Boolean criticalOnNonconformity,

    @NotNull(message = "A ordem do item é obrigatória")
    Integer displayOrder

) {
}