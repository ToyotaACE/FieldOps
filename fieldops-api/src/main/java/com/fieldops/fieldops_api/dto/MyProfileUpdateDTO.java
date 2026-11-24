
package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MyProfileUpdateDTO(
    @NotBlank
    @Size(max = 120)
    String name,

    @Pattern(
        regexp = "^$|\\d{11}",
        message = "O CPF deve conter 11 números."
    )
    String document,

    @Pattern(
        regexp = "^$|\\d{10,11}",
        message = "O telefone deve conter DDD e número."
    )
    String phone
) {}
