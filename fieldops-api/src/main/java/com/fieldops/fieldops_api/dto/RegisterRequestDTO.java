
package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequestDTO(

    @NotBlank
    @Size(max = 120)
    String name,

    @NotBlank
    @Email
    @Size(max = 150)
    String email,

    @NotBlank
    @Size(min = 6, max = 100)
    String password

) {
}
