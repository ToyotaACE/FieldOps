package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.InspectionTemplateVersionResponseDTO;
import com.fieldops.fieldops_api.services.InspectionTemplateVersionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inspection-template-versions")
public class InspectionTemplateVersionController {

    private final InspectionTemplateVersionService service;

    public InspectionTemplateVersionController(
            InspectionTemplateVersionService service
    ) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionTemplateVersionResponseDTO> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping("/template/{templateId}")
    public ResponseEntity<InspectionTemplateVersionResponseDTO> createNewVersion(
            @PathVariable Long templateId
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createNewVersion(templateId));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<InspectionTemplateVersionResponseDTO> publish(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.publish(id));
    }
}