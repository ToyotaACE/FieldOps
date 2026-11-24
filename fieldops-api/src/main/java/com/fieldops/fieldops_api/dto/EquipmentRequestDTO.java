package com.fieldops.fieldops_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EquipmentRequestDTO(

    @NotBlank(message = "O nome do equipamento é obrigatório")
    @Size(max = 150, message = "O nome deve possuir no máximo 150 caracteres")
    String name,

    @Size(max = 100, message = "A categoria deve possuir no máximo 100 caracteres")
    String category,

    @Size(max = 100, message = "O número de série deve possuir no máximo 100 caracteres")
    String serialNumber,

    @NotBlank(message = "O QR Code é obrigatório")
    @Size(max = 150, message = "O QR Code deve possuir no máximo 150 caracteres")
    String qrCode,

    @NotNull(message = "O local é obrigatório")
    Long siteId

) {
}