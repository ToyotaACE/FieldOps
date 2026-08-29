package com.fieldops.fieldops_api.dto;

public record LoginResponseDTO(

    String accessToken,
    String tokenType

) {
}