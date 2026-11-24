package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.InspectionTemplateRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionTemplateResponseDTO;
import com.fieldops.fieldops_api.dto.InspectionTemplateVersionResponseDTO;
import com.fieldops.fieldops_api.services.InspectionTemplateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspection-templates")
public class InspectionTemplateController {

    private final InspectionTemplateService service;

    public InspectionTemplateController(InspectionTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<InspectionTemplateResponseDTO>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionTemplateResponseDTO> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<InspectionTemplateVersionResponseDTO>> findVersions(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findVersions(id));
    }

    @PostMapping
    public ResponseEntity<InspectionTemplateResponseDTO> create(
            @Valid @RequestBody InspectionTemplateRequestDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InspectionTemplateResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody InspectionTemplateRequestDTO dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(
            @PathVariable Long id
    ) {
        service.activate(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id
    ) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}