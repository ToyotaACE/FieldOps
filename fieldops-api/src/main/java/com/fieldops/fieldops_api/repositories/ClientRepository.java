package com.fieldops.fieldops_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fieldops.fieldops_api.entities.Client;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

}