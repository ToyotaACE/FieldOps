package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.InspectionRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionResponseDTO;
import com.fieldops.fieldops_api.entities.*;
import com.fieldops.fieldops_api.repositories.InspectionRepository;
import com.fieldops.fieldops_api.repositories.InspectionSiteRepository;
import com.fieldops.fieldops_api.repositories.EquipmentRepository;
import com.fieldops.fieldops_api.repositories.InspectionTemplateVersionRepository;
import com.fieldops.fieldops_api.repositories.UserRepository;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final InspectionTemplateVersionRepository versionRepository;
    private final InspectionSiteRepository siteRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    public InspectionService(
            InspectionRepository inspectionRepository,
            InspectionTemplateVersionRepository versionRepository,
            InspectionSiteRepository siteRepository,
            EquipmentRepository equipmentRepository,
            UserRepository userRepository
    ) {
        this.inspectionRepository = inspectionRepository;
        this.versionRepository = versionRepository;
        this.siteRepository = siteRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public InspectionResponseDTO create(InspectionRequestDTO dto) {

        InspectionTemplateVersion version = versionRepository
                .findById(dto.getTemplateVersionId())
                .orElseThrow(() -> new RuntimeException(
                        "Versão do modelo de inspeção não encontrada."
                ));

        if (!version.getPublished()) {
            throw new RuntimeException(
                    "A inspeção só pode utilizar uma versão publicada do modelo."
            );
        }

        InspectionSite site = siteRepository
                .findById(dto.getSiteId())
                .orElseThrow(() -> new RuntimeException(
                        "Local da inspeção não encontrado."
                ));

        if (!site.getActive()) {
            throw new RuntimeException(
                    "O local da inspeção está inativo."
            );
        }

        Equipment equipment = equipmentRepository
                .findById(dto.getEquipmentId())
                .orElseThrow(() -> new RuntimeException(
                        "Equipamento não encontrado."
                ));

        if (!equipment.getActive()) {
            throw new RuntimeException(
                    "O equipamento está inativo."
            );
        }

        if (!equipment.getSite().getId().equals(site.getId())) {
            throw new RuntimeException(
                    "O equipamento não pertence ao local informado."
            );
        }

        User technician = userRepository
                .findById(dto.getTechnicianId())
                .orElseThrow(() -> new RuntimeException(
                        "Técnico não encontrado."
                ));

        if (!technician.getActive()) {
            throw new RuntimeException(
                    "O técnico está inativo."
            );
        }

        Inspection inspection = new Inspection();

        inspection.setTitle(dto.getTitle());
        inspection.setTemplateVersion(version);
        inspection.setClient(site.getClient());
        inspection.setSite(site);
        inspection.setEquipment(equipment);
        inspection.setTechnician(technician);
        inspection.setScheduledDate(dto.getScheduledDate());
        inspection.setStatus(InspectionStatus.SCHEDULED);

        Inspection saved = inspectionRepository.save(inspection);

        return toResponseDTO(saved);
    }

    @Transactional
    public List<InspectionResponseDTO> findAll() {
        return inspectionRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public InspectionResponseDTO findById(Long id) {

        Inspection inspection = inspectionRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Inspeção não encontrada."
                ));

        return toResponseDTO(inspection);
    }

    @Transactional
    public List<InspectionResponseDTO> findByTechnician(Long technicianId) {
        return inspectionRepository.findByTechnicianId(technicianId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public List<InspectionResponseDTO> findBySite(Long siteId) {
        return inspectionRepository.findBySiteId(siteId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public List<InspectionResponseDTO> findByEquipment(Long equipmentId) {
        return inspectionRepository.findByEquipmentId(equipmentId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public List<InspectionResponseDTO> findByStatus(InspectionStatus status) {
        return inspectionRepository.findByStatus(status)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional
    public InspectionResponseDTO updateStatus(
            Long id,
            InspectionStatus status
    ) {

        Inspection inspection = inspectionRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Inspeção não encontrada."
                ));

        inspection.setStatus(status);

        Inspection updated = inspectionRepository.save(inspection);

        return toResponseDTO(updated);
    }

    private InspectionResponseDTO toResponseDTO(Inspection inspection) {

        InspectionResponseDTO dto = new InspectionResponseDTO();

        dto.setId(inspection.getId());
        dto.setTitle(inspection.getTitle());

        dto.setTemplateVersionId(
                inspection.getTemplateVersion().getId()
        );

        dto.setClientId(
                inspection.getClient().getId()
        );

        dto.setSiteId(
                inspection.getSite().getId()
        );

        dto.setEquipmentId(
                inspection.getEquipment().getId()
        );

        dto.setTechnicianId(
                inspection.getTechnician().getId()
        );

        dto.setScheduledDate(
                inspection.getScheduledDate()
        );

        dto.setStatus(
                inspection.getStatus()
        );

        dto.setCreatedAt(
                inspection.getCreatedAt()
        );

        dto.setUpdatedAt(
                inspection.getUpdatedAt()
        );

        return dto;
    }
}