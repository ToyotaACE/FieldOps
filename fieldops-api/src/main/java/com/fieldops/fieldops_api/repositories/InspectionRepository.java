package com.fieldops.fieldops_api.repositories;

import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    List<Inspection> findByTechnicianId(Long technicianId);

    List<Inspection> findBySiteId(Long siteId);

    List<Inspection> findByEquipmentId(Long equipmentId);

    List<Inspection> findByStatus(InspectionStatus status);
}