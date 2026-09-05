package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.TemplateSectionResponseDTO;
import com.fieldops.fieldops_api.dto.TemplateSectionRequestDTO;
import com.fieldops.fieldops_api.services.TemplateSectionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/template-sections")
public class TemplateSectionController {

    private final TemplateSectionService service;

    public TemplateSectionController(TemplateSectionService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<TemplateSectionResponseDTO> findById(
            @PathVariable Long id) {

        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/version/{versionId}")
    public ResponseEntity<List<TemplateSectionResponseDTO>> findByVersionId(
            @PathVariable Long versionId) {

        return ResponseEntity.ok(service.findByVersionId(versionId));
    }

    @PostMapping("/version/{versionId}")
    public ResponseEntity<TemplateSectionResponseDTO> create(
            @PathVariable Long versionId,
            @RequestBody TemplateSectionRequestDTO request) {

        TemplateSectionResponseDTO response =
                service.create(versionId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TemplateSectionResponseDTO> update(
            @PathVariable Long id,
            @RequestBody TemplateSectionRequestDTO request) {

        TemplateSectionResponseDTO response =
                service.update(id, request);

        return ResponseEntity.ok(response);
    }
}