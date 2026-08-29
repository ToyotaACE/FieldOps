package com.fieldops.fieldops_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fieldops.fieldops_api.entities.Equipment;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Optional<Equipment> findByQrCode(String qrCode);

    boolean existsByQrCode(String qrCode);

    boolean existsByQrCodeAndIdNot(String qrCode, Long id);

    List<Equipment> findBySiteId(Long siteId);
}