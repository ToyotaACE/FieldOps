package com.fieldops.fieldops_api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fieldops.fieldops_api.dto.SyncDTOs.BatchRequest;
import com.fieldops.fieldops_api.dto.SyncDTOs.BatchResponse;
import com.fieldops.fieldops_api.services.SyncService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/sync")
public class SyncController {

    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    /**
     * Recebe o lote de operações da fila (outbox) do aplicativo.
     * Cada operação é idempotente pelo operationId.
     */
    @PostMapping("/operations")
    public ResponseEntity<BatchResponse> operations(
            @Valid @RequestBody BatchRequest batch
    ) {
        return ResponseEntity.ok(syncService.process(batch));
    }
}
