package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

import com.fieldops.fieldops_api.entities.Role;

public record UserResponseDTO(

    Long id,
    String name,
    String email,
    Role role,
    Boolean active,
    LocalDateTime createdAt,
    LocalDateTime updatedAt

) {
}