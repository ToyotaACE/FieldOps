package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.fieldops.fieldops_api.dto.ClientRequestDTO;
import com.fieldops.fieldops_api.dto.ClientResponseDTO;
import com.fieldops.fieldops_api.entities.Client;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.ClientRepository;

@Service
public class ClientService {

    private final ClientRepository repository;

    public ClientService(ClientRepository repository) {
        this.repository = repository;
    }

    public List<ClientResponseDTO> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public ClientResponseDTO findById(Long id) {

        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        return toResponseDTO(client);
    }

    public ClientResponseDTO create(ClientRequestDTO dto) {

        Client client = new Client();

        client.setName(dto.name());
        client.setDocument(dto.document());
        client.setActive(true);

        client = repository.save(client);

        return toResponseDTO(client);
    }

    public ClientResponseDTO update(Long id, ClientRequestDTO dto) {

        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        client.setName(dto.name());
        client.setDocument(dto.document());

        client = repository.save(client);

        return toResponseDTO(client);
    }

    public ClientResponseDTO deactivate(Long id) {

        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        client.setActive(false);

        client = repository.save(client);

        return toResponseDTO(client);
    }

    public ClientResponseDTO activate(Long id) {

        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        client.setActive(true);

        client = repository.save(client);

        return toResponseDTO(client);
    }

    private ClientResponseDTO toResponseDTO(Client client) {

        return new ClientResponseDTO(
                client.getId(),
                client.getName(),
                client.getDocument(),
                client.getActive(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }
}