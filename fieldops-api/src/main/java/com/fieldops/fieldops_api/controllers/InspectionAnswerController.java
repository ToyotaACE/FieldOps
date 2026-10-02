package com.fieldops.fieldops_api.controllers;

import com.fieldops.fieldops_api.dto.InspectionAnswerRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionAnswerResponseDTO;
import com.fieldops.fieldops_api.services.InspectionAnswerService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inspections/{inspectionId}/answers")
public class InspectionAnswerController {

    private final InspectionAnswerService answerService;

    public InspectionAnswerController(
            InspectionAnswerService answerService
    ) {
        this.answerService = answerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InspectionAnswerResponseDTO create(
            @PathVariable Long inspectionId,
            @RequestBody InspectionAnswerRequestDTO dto
    ) {
        return answerService.save(inspectionId, dto);
    }

    @GetMapping
    public List<InspectionAnswerResponseDTO> findByInspection(
            @PathVariable Long inspectionId
    ) {
        return answerService.findByInspection(inspectionId);
    }

    @PutMapping("/{answerId}")
    public InspectionAnswerResponseDTO update(
            @PathVariable Long inspectionId,
            @PathVariable Long answerId,
            @RequestBody InspectionAnswerRequestDTO dto
    ) {
        return answerService.update(inspectionId, answerId, dto);
    }
}