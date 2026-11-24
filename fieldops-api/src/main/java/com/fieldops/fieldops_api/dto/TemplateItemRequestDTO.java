package com.fieldops.fieldops_api.dto;

import java.util.List;

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

    Boolean requiresEvidence,

    @NotNull(message = "A ordem do item é obrigatória")
    Integer displayOrder,

    // Opções da seleção única (obrigatórias para SINGLE_CHOICE)
    List<String> options
) {
}
