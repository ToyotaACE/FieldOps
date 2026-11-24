package com.fieldops.fieldops_api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fieldops.fieldops_api.dto.InspectionSiteRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionSiteResponseDTO;
import com.fieldops.fieldops_api.services.InspectionSiteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/sites")
public class InspectionSiteController {

    private final InspectionSiteService service;

    public InspectionSiteController(InspectionSiteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<InspectionSiteResponseDTO>> findAll(
            @RequestParam(required = false) Long clientId) {

        if (clientId != null) {
            return ResponseEntity.ok(service.findByClientId(clientId));
        }

        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionSiteResponseDTO> findById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<InspectionSiteResponseDTO> create(
            @Valid @RequestBody InspectionSiteRequestDTO dto) {

        InspectionSiteResponseDTO site = service.create(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(site);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InspectionSiteResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody InspectionSiteRequestDTO dto) {

        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<InspectionSiteResponseDTO> deactivate(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.deactivate(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<InspectionSiteResponseDTO> activate(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.activate(id));
    }
}