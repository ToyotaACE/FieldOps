package com.fieldops.fieldops_api.services;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fieldops.fieldops_api.dto.UserRequestDTO;
import com.fieldops.fieldops_api.dto.UserResponseDTO;
import com.fieldops.fieldops_api.dto.UserUpdateDTO;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.repositories.UserRepository;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository repository,
            PasswordEncoder passwordEncoder) {

        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponseDTO> findAll() {

        return repository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .toList();
    }

    public UserResponseDTO findById(Long id) {

        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return toResponseDTO(user);
    }

    public UserResponseDTO create(UserRequestDTO dto) {

        if (repository.existsByEmail(dto.email())) {
            throw new RuntimeException("E-mail já cadastrado");
        }

        User user = new User();

        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole(dto.role());
        user.setActive(true);

        user = repository.save(user);

        return toResponseDTO(user);
    }

    public UserResponseDTO update(Long id, UserUpdateDTO dto) {

        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        repository.findByEmail(dto.email())
                .filter(existingUser -> !existingUser.getId().equals(id))
                .ifPresent(existingUser -> {
                    throw new RuntimeException("E-mail já cadastrado");
                });

        user.setName(dto.name());
        user.setEmail(dto.email());
        user.setRole(dto.role());

        user = repository.save(user);

        return toResponseDTO(user);
    }

    public UserResponseDTO deactivate(Long id) {

        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        user.setActive(false);

        user = repository.save(user);

        return toResponseDTO(user);
    }

    private UserResponseDTO toResponseDTO(User user) {

        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}