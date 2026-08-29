package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.InspectionSiteRequestDTO;
import com.fieldops.fieldops_api.dto.InspectionSiteResponseDTO;
import com.fieldops.fieldops_api.entities.Client;
import com.fieldops.fieldops_api.entities.InspectionSite;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.ClientRepository;
import com.fieldops.fieldops_api.repositories.InspectionSiteRepository;

@Service
@Transactional(readOnly = true)
public class InspectionSiteService {

    private final InspectionSiteRepository siteRepository;
    private final ClientRepository clientRepository;

    public InspectionSiteService(
            InspectionSiteRepository siteRepository,
            ClientRepository clientRepository) {

        this.siteRepository = siteRepository;
        this.clientRepository = clientRepository;
    }

    public List<InspectionSiteResponseDTO> findAll() {

        return siteRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public List<InspectionSiteResponseDTO> findByClientId(Long clientId) {

        return siteRepository.findByClientId(clientId)
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public InspectionSiteResponseDTO findById(Long id) {

        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Local não encontrado"));

        return toResponseDTO(site);
    }

    @Transactional
    public InspectionSiteResponseDTO create(InspectionSiteRequestDTO dto) {

        Client client = clientRepository.findById(dto.clientId())
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        if (!client.getActive()) {
            throw new BusinessException(
                    "Não é possível cadastrar local para cliente inativo"
            );
        }

        InspectionSite site = new InspectionSite();

        site.setName(dto.name());
        site.setAddress(dto.address());
        site.setCity(dto.city());
        site.setState(dto.state());
        site.setClient(client);
        site.setActive(true);

        site = siteRepository.save(site);

        return toResponseDTO(site);
    }

    @Transactional
    public InspectionSiteResponseDTO update(
            Long id,
            InspectionSiteRequestDTO dto) {

        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Local não encontrado"));

        Client client = clientRepository.findById(dto.clientId())
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        if (!client.getActive()) {
            throw new BusinessException(
                    "Não é possível vincular o local a um cliente inativo"
            );
        }

        site.setName(dto.name());
        site.setAddress(dto.address());
        site.setCity(dto.city());
        site.setState(dto.state());
        site.setClient(client);

        site = siteRepository.save(site);

        return toResponseDTO(site);
    }

    @Transactional
    public InspectionSiteResponseDTO deactivate(Long id) {

        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Local não encontrado"));

        site.setActive(false);

        site = siteRepository.save(site);

        return toResponseDTO(site);
    }

    @Transactional
    public InspectionSiteResponseDTO activate(Long id) {

        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Local não encontrado"));

        if (!site.getClient().getActive()) {
            throw new BusinessException(
                    "Não é possível ativar um local de cliente inativo"
            );
        }

        site.setActive(true);

        site = siteRepository.save(site);

        return toResponseDTO(site);
    }

    private InspectionSiteResponseDTO toResponseDTO(
            InspectionSite site) {

        return new InspectionSiteResponseDTO(
                site.getId(),
                site.getName(),
                site.getAddress(),
                site.getCity(),
                site.getState(),
                site.getActive(),
                site.getClient().getId(),
                site.getClient().getName(),
                site.getCreatedAt(),
                site.getUpdatedAt()
        );
    }
}