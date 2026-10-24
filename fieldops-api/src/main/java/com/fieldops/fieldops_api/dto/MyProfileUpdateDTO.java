package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MyProfileUpdateDTO(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Email @Size(max = 150) String email
) {}