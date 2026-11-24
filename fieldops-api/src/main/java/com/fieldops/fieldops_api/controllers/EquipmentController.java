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

import com.fieldops.fieldops_api.dto.EquipmentRequestDTO;
import com.fieldops.fieldops_api.dto.EquipmentResponseDTO;
import com.fieldops.fieldops_api.services.EquipmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/equipments")
public class EquipmentController {

    private final EquipmentService service;

    public EquipmentController(EquipmentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<EquipmentResponseDTO>> findAll(
            @RequestParam(required = false) Long siteId) {

        if (siteId != null) {
            return ResponseEntity.ok(service.findBySiteId(siteId));
        }

        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponseDTO> findById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/qr/{qrCode}")
    public ResponseEntity<EquipmentResponseDTO> findByQrCode(
            @PathVariable String qrCode) {

        return ResponseEntity.ok(service.findByQrCode(qrCode));
    }

    @PostMapping
    public ResponseEntity<EquipmentResponseDTO> create(
            @Valid @RequestBody EquipmentRequestDTO dto) {

        EquipmentResponseDTO equipment = service.create(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(equipment);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentRequestDTO dto) {

        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<EquipmentResponseDTO> deactivate(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.deactivate(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<EquipmentResponseDTO> activate(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.activate(id));
    }
}