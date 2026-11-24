package com.fieldops.fieldops_api.dto;

import java.time.OffsetDateTime;

/**
 * Dados enviados pelo aplicativo ao iniciar ou concluir uma inspeção:
 * horário do dispositivo (RN-034 / RN-042) e localização opcional
 * (RN-061 / RN-062).
 */
public record InspectionExecutionRequestDTO(
    OffsetDateTime deviceTime,
    Double latitude,
    Double longitude,
    Double accuracy,
    OffsetDateTime locationTime
) {
}
