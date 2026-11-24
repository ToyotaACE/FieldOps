package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientRequestDTO(

    @NotBlank(message = "O nome do cliente é obrigatório")
    @Size(max = 150, message = "O nome deve possuir no máximo 150 caracteres")
    String name,

    @Size(max = 20, message = "O documento deve possuir no máximo 20 caracteres")
    String document

) {
}