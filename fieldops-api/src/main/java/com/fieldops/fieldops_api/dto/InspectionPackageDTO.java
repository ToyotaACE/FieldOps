package com.fieldops.fieldops_api.dto;

import java.util.List;

/**
 * Pacote completo de uma inspeção: dados, checklist (seções e itens do
 * modelo na versão exata da inspeção), respostas, evidências, não
 * conformidades e histórico.
 *
 * É a fonte única usada pelo Web (revisão) e pelo Mobile (download para
 * uso offline), o que garante que as perguntas sejam idênticas.
 */
public record InspectionPackageDTO(
    InspectionResponseDTO inspection,
    List<Section> sections,
    List<InspectionAnswerResponseDTO> answers,
    List<InspectionEvidenceResponseDTO> evidences,
    List<NonConformityResponseDTO> nonConformities,
    List<AuditLogResponseDTO> history
) {

    public record Section(
        Long id,
        String title,
        String description,
        Integer displayOrder,
        List<TemplateItemResponseDTO> items
    ) {
    }
}
