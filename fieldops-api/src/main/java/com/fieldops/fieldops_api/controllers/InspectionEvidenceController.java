package com.fieldops.fieldops_api.controllers;

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
    public ResponseEntity<InspectionEvidence> upload(
            @PathVariable Long answerId,
            @RequestParam("file") MultipartFile file) {

        InspectionEvidence evidence =
                evidenceService.upload(answerId, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(evidence);
    }

    @GetMapping("/answers/{answerId}")
    public ResponseEntity<List<InspectionEvidence>> findByAnswer(
            @PathVariable Long answerId) {

        return ResponseEntity.ok(
                evidenceService.findByAnswer(answerId));
    }
}