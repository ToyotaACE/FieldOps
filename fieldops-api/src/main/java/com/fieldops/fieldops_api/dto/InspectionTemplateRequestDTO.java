package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InspectionTemplateRequestDTO(

    @NotBlank(message = "O título do modelo é obrigatório")
    @Size(max = 150)
    String title,

    @NotBlank(message = "A categoria é obrigatória")
    @Size(max = 100)
    String category,

    @Size(max = 500)
    String description

) {
}