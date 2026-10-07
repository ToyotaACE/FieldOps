package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.InspectionEvidenceResponseDTO;
import com.fieldops.fieldops_api.entities.InspectionEvidence;
import com.fieldops.fieldops_api.services.InspectionEvidenceService;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspection-evidences")
public class InspectionEvidenceController {

    private final InspectionEvidenceService evidenceService;

    public InspectionEvidenceController(
            InspectionEvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @PostMapping(
            value = "/answers/{answerId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionEvidenceResponseDTO> upload(
            @PathVariable Long answerId,
            @RequestParam("file") MultipartFile file) {

        InspectionEvidence evidence =
                evidenceService.upload(answerId, file);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponseDTO(evidence));
    }

    @GetMapping("/answers/{answerId}")
    public ResponseEntity<List<InspectionEvidenceResponseDTO>> findByAnswer(
            @PathVariable Long answerId) {

        List<InspectionEvidenceResponseDTO> evidences =
                evidenceService.findByAnswer(answerId)
                        .stream()
                        .map(this::toResponseDTO)
                        .toList();

        return ResponseEntity.ok(evidences);
    }

    private InspectionEvidenceResponseDTO toResponseDTO(
            InspectionEvidence evidence) {

        return new InspectionEvidenceResponseDTO(
                evidence.getId(),
                evidence.getInspectionAnswer().getId(),
                evidence.getOriginalFilename(),
                evidence.getContentType(),
                evidence.getUploadedAt()
        );
    }
}