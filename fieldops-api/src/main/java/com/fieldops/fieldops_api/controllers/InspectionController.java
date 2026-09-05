package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.InspectionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.services.InspectionService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspections")
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @PostMapping
    public ResponseEntity<InspectionResponseDTO> create(
            @Valid @RequestBody InspectionRequestDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(inspectionService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<InspectionResponseDTO>> findAll() {
        return ResponseEntity.ok(inspectionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionResponseDTO> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                inspectionService.findById(id)
        );
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<InspectionResponseDTO>> findByTechnician(
            @PathVariable Long technicianId
    ) {
        return ResponseEntity.ok(
                inspectionService.findByTechnician(technicianId)
        );
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<InspectionResponseDTO>> findBySite(
            @PathVariable Long siteId
    ) {
        return ResponseEntity.ok(
                inspectionService.findBySite(siteId)
        );
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<InspectionResponseDTO>> findByEquipment(
            @PathVariable Long equipmentId
    ) {
        return ResponseEntity.ok(
                inspectionService.findByEquipment(equipmentId)
        );
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<InspectionResponseDTO>> findByStatus(
            @PathVariable InspectionStatus status
    ) {
        return ResponseEntity.ok(
                inspectionService.findByStatus(status)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InspectionResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam InspectionStatus status
    ) {
        return ResponseEntity.ok(
                inspectionService.updateStatus(id, status)
        );
    }
}