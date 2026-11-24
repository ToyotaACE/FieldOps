package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TemplateSectionRequestDTO(

    @NotBlank(message = "O título da seção é obrigatório")
    @Size(max = 150)
    String title,

    @Size(max = 500)
    String description,

    @NotNull(message = "A ordem da seção é obrigatória")
    Integer displayOrder

) {
}