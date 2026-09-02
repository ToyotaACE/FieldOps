package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.TemplateItemRequestDTO;
import com.fieldops.fieldops_api.dto.TemplateItemResponseDTO;
import com.fieldops.fieldops_api.services.TemplateItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class TemplateItemController {

    private final TemplateItemService service;

    public TemplateItemController(TemplateItemService service) {
        this.service = service;
    }

    @GetMapping("/template-sections/{sectionId}/items")
    public ResponseEntity<List<TemplateItemResponseDTO>> findBySectionId(
            @PathVariable Long sectionId
    ) {
        return ResponseEntity.ok(service.findBySectionId(sectionId));
    }

    @GetMapping("/template-items/{id}")
    public ResponseEntity<TemplateItemResponseDTO> findById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping("/template-sections/{sectionId}/items")
    public ResponseEntity<TemplateItemResponseDTO> create(
            @PathVariable Long sectionId,
            @Valid @RequestBody TemplateItemRequestDTO dto
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(sectionId, dto));
    }

    @PutMapping("/template-items/{id}")
    public ResponseEntity<TemplateItemResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody TemplateItemRequestDTO dto
    ) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/template-items/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}