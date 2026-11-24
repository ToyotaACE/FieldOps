package com.fieldops.fieldops_api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fieldops.fieldops_api.dto.NonConformityRequestDTO;
import com.fieldops.fieldops_api.dto.NonConformityResponseDTO;
import com.fieldops.fieldops_api.services.NonConformityService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/inspections/{inspectionId}/nonconformities")
public class NonConformityController {

    private final NonConformityService service;

    public NonConformityController(NonConformityService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<NonConformityResponseDTO>> findByInspection(
            @PathVariable Long inspectionId) {

        return ResponseEntity.ok(service.findByInspection(inspectionId));
    }

    @PostMapping
    public ResponseEntity<NonConformityResponseDTO> create(
            @PathVariable Long inspectionId,
            @Valid @RequestBody NonConformityRequestDTO dto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(inspectionId, dto));
    }
}
