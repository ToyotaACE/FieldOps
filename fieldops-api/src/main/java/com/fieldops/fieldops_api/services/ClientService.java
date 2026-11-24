
package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fieldops.fieldops_api.dto.ClientRequestDTO;
import com.fieldops.fieldops_api.dto.ClientResponseDTO;
import com.fieldops.fieldops_api.entities.Client;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.ClientRepository;

@Service
public class ClientService {

    private final ClientRepository repository;
    private final AuditLogService auditLogService;

    public ClientService(
            ClientRepository repository,
            AuditLogService auditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ClientResponseDTO> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientResponseDTO findById(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        return toResponseDTO(client);
    }

    @Transactional
    public ClientResponseDTO create(ClientRequestDTO dto) {
        Client client = new Client();

        client.setName(dto.name());
        client.setDocument(dto.document());
        client.setActive(true);

        client = repository.save(client);

        auditLogService.record(
                "CREATE",
                "Client",
                client.getId(),
                "Cliente cadastrado: " + client.getName()
        );

        return toResponseDTO(client);
    }

    @Transactional
    public ClientResponseDTO update(Long id, ClientRequestDTO dto) {
        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        client.setName(dto.name());
        client.setDocument(dto.document());

        client = repository.save(client);

        auditLogService.record(
                "UPDATE",
                "Client",
                client.getId(),
                "Dados do cliente atualizados: " + client.getName()
        );

        return toResponseDTO(client);
    }

    @Transactional
    public ClientResponseDTO deactivate(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        client.setActive(false);

        client = repository.save(client);

        auditLogService.record(
                "DEACTIVATE",
                "Client",
                client.getId(),
                "Cliente desativado: " + client.getName()
        );

        return toResponseDTO(client);
    }

    @Transactional
    public ClientResponseDTO activate(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() ->
                        new BusinessException("Cliente não encontrado"));

        client.setActive(true);

        client = repository.save(client);

        auditLogService.record(
                "ACTIVATE",
                "Client",
                client.getId(),
                "Cliente ativado: " + client.getName()
        );

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
