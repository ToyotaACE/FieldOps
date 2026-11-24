package com.fieldops.fieldops_api.dto;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Contrato da sincronização offline (outbox do aplicativo).
 */
public final class SyncDTOs {

    private SyncDTOs() {
    }

    /**
     * Uma operação da fila do aplicativo.
     *
     * type: START | COMPLETE | REOPEN | ANSWER | NONCONFORMITY
     */
    public record OperationRequest(

        @NotBlank
        @Size(max = 64)
        String operationId,

        @NotBlank
        @Size(max = 30)
        String type,

        @NotNull
        Long inspectionId,

        // START / COMPLETE
        OffsetDateTime deviceTime,
        Double latitude,
        Double longitude,
        Double accuracy,
        OffsetDateTime locationTime,

        // ANSWER
        Long templateItemId,
        String value,
        String observation,

        // NONCONFORMITY
        NonConformityRequestDTO nonConformity
    ) {
    }

    public record BatchRequest(

        @NotEmpty
        @Size(max = 200)
        @Valid
        List<OperationRequest> operations
    ) {
    }

    /**
     * status: APPLIED (aplicada agora), DUPLICATE (já havia sido aplicada,
     * nada foi repetido) ou REJECTED (violou uma regra; message explica).
     */
    public record OperationResult(
        String operationId,
        String status,
        Long entityId,
        String message,
        InspectionAnswerResponseDTO answer,
        NonConformityResponseDTO nonConformity,
        InspectionResponseDTO inspection
    ) {
    }

    public record BatchResponse(
        List<OperationResult> results,
        OffsetDateTime serverTime
    ) {
    }
}
