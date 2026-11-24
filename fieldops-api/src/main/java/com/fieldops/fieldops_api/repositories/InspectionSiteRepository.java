package com.fieldops.fieldops_api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fieldops.fieldops_api.entities.InspectionSite;

@Repository
public interface InspectionSiteRepository extends JpaRepository<InspectionSite, Long> {

    List<InspectionSite> findByClientId(Long clientId);

}