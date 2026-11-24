package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.InspectionExecutionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionPackageDTO;
import com.fieldops.fieldops_api.dto.InspectionReasonRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.services.InspectionPackageService;
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
    private final InspectionPackageService packageService;

    public InspectionController(
            InspectionService inspectionService,
            InspectionPackageService packageService) {
        this.inspectionService = inspectionService;
        this.packageService = packageService;
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

    /**
     * Inspeção completa: checklist, respostas, evidências, não
     * conformidades e histórico (usada pela revisão no Web e pelo
     * download offline no Mobile).
     */
    @GetMapping("/{id}/package")
    public ResponseEntity<InspectionPackageDTO> findPackage(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(packageService.build(id));
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

    /** Mantido por compatibilidade (aprovar/reprovar/cancelar têm endpoints próprios). */
    @PatchMapping("/{id}/status")
    public ResponseEntity<InspectionResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam InspectionStatus status
    ) {
        return ResponseEntity.ok(
                inspectionService.updateStatus(id, status)
        );
    }

    // ----------------------------- técnico -----------------------------

    @PostMapping("/{id}/start")
    public ResponseEntity<InspectionResponseDTO> start(
            @PathVariable Long id,
            @RequestBody(required = false) InspectionExecutionRequestDTO body
    ) {
        return ResponseEntity.ok(inspectionService.start(id, body));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<InspectionResponseDTO> complete(
            @PathVariable Long id,
            @RequestBody(required = false) InspectionExecutionRequestDTO body
    ) {
        return ResponseEntity.ok(inspectionService.complete(id, body));
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<InspectionResponseDTO> reopen(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(inspectionService.reopen(id));
    }

    // ---------------------------- supervisor ----------------------------

    @PostMapping("/{id}/review")
    public ResponseEntity<InspectionResponseDTO> startReview(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(inspectionService.startReview(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<InspectionResponseDTO> approve(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) InspectionReasonRequestDTO body
    ) {
        return ResponseEntity.ok(
                inspectionService.approve(id, body == null ? null : body.reason())
        );
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<InspectionResponseDTO> reject(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) InspectionReasonRequestDTO body
    ) {
        return ResponseEntity.ok(
                inspectionService.reject(id, body == null ? null : body.reason())
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<InspectionResponseDTO> cancel(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) InspectionReasonRequestDTO body
    ) {
        return ResponseEntity.ok(
                inspectionService.cancel(id, body == null ? null : body.reason())
        );
    }
}
