package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InspectionSiteRequestDTO(

    @NotBlank(message = "O nome do local é obrigatório")
    @Size(max = 150, message = "O nome deve possuir no máximo 150 caracteres")
    String name,

    @Size(max = 250, message = "O endereço deve possuir no máximo 250 caracteres")
    String address,

    @Size(max = 100, message = "A cidade deve possuir no máximo 100 caracteres")
    String city,

    @Size(max = 100, message = "O estado deve possuir no máximo 100 caracteres")
    String state,

    @NotNull(message = "O cliente é obrigatório")
    Long clientId

) {
}