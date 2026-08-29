package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.EquipmentRequestDTO;
import com.fieldops.fieldops_api.dto.EquipmentResponseDTO;
import com.fieldops.fieldops_api.entities.Equipment;
import com.fieldops.fieldops_api.entities.InspectionSite;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.EquipmentRepository;
import com.fieldops.fieldops_api.repositories.InspectionSiteRepository;

@Service
@Transactional(readOnly = true)
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final InspectionSiteRepository siteRepository;

    public EquipmentService(
            EquipmentRepository equipmentRepository,
            InspectionSiteRepository siteRepository) {

        this.equipmentRepository = equipmentRepository;
        this.siteRepository = siteRepository;
    }

    public List<EquipmentResponseDTO> findAll() {

        return equipmentRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public EquipmentResponseDTO findById(Long id) {

        Equipment equipment = findEquipment(id);

        return toResponseDTO(equipment);
    }

    public List<EquipmentResponseDTO> findBySiteId(Long siteId) {

        return equipmentRepository.findBySiteId(siteId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public EquipmentResponseDTO findByQrCode(String qrCode) {

        Equipment equipment = equipmentRepository.findByQrCode(qrCode)
                .orElseThrow(() ->
                        new BusinessException("Equipamento não encontrado"));

        return toResponseDTO(equipment);
    }

    @Transactional
    public EquipmentResponseDTO create(EquipmentRequestDTO dto) {

        if (equipmentRepository.existsByQrCode(dto.qrCode())) {
            throw new BusinessException(
                    "Já existe um equipamento com este QR Code"
            );
        }

        InspectionSite site = findValidSite(dto.siteId());

        Equipment equipment = new Equipment();

        equipment.setName(dto.name());
        equipment.setCategory(dto.category());
        equipment.setSerialNumber(dto.serialNumber());
        equipment.setQrCode(dto.qrCode());
        equipment.setSite(site);
        equipment.setActive(true);

        equipment = equipmentRepository.save(equipment);

        return toResponseDTO(equipment);
    }

    @Transactional
    public EquipmentResponseDTO update(
            Long id,
            EquipmentRequestDTO dto) {

        Equipment equipment = findEquipment(id);

        if (equipmentRepository.existsByQrCodeAndIdNot(
                dto.qrCode(),
                id)) {

            throw new BusinessException(
                    "Já existe outro equipamento com este QR Code"
            );
        }

        InspectionSite site = findValidSite(dto.siteId());

        equipment.setName(dto.name());
        equipment.setCategory(dto.category());
        equipment.setSerialNumber(dto.serialNumber());
        equipment.setQrCode(dto.qrCode());
        equipment.setSite(site);

        equipment = equipmentRepository.save(equipment);

        return toResponseDTO(equipment);
    }

    @Transactional
    public EquipmentResponseDTO deactivate(Long id) {

        Equipment equipment = findEquipment(id);

        equipment.setActive(false);

        equipment = equipmentRepository.save(equipment);

        return toResponseDTO(equipment);
    }

    @Transactional
    public EquipmentResponseDTO activate(Long id) {

        Equipment equipment = findEquipment(id);

        InspectionSite site = equipment.getSite();

        if (!site.getActive()) {
            throw new BusinessException(
                    "Não é possível ativar um equipamento de um local inativo"
            );
        }

        if (!site.getClient().getActive()) {
            throw new BusinessException(
                    "Não é possível ativar um equipamento de um cliente inativo"
            );
        }

        equipment.setActive(true);

        equipment = equipmentRepository.save(equipment);

        return toResponseDTO(equipment);
    }

    private Equipment findEquipment(Long id) {

        return equipmentRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Equipamento não encontrado"));
    }

    private InspectionSite findValidSite(Long siteId) {

        InspectionSite site = siteRepository.findById(siteId)
                .orElseThrow(() ->
                        new BusinessException("Local não encontrado"));

        if (!site.getActive()) {
            throw new BusinessException(
                    "Não é possível vincular equipamento a um local inativo"
            );
        }

        if (!site.getClient().getActive()) {
            throw new BusinessException(
                    "Não é possível vincular equipamento a um cliente inativo"
            );
        }

        return site;
    }

    private EquipmentResponseDTO toResponseDTO(Equipment equipment) {

        InspectionSite site = equipment.getSite();

        return new EquipmentResponseDTO(
                equipment.getId(),
                equipment.getName(),
                equipment.getCategory(),
                equipment.getSerialNumber(),
                equipment.getQrCode(),
                equipment.getActive(),

                site.getId(),
                site.getName(),

                site.getClient().getId(),
                site.getClient().getName(),

                equipment.getCreatedAt(),
                equipment.getUpdatedAt()
        );
    }
}