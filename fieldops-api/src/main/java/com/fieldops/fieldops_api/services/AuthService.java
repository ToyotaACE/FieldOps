package com.fieldops.fieldops_api.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fieldops.fieldops_api.dto.LoginRequestDTO;
import com.fieldops.fieldops_api.dto.LoginResponseDTO;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.exceptions.BusinessException;
import com.fieldops.fieldops_api.repositories.UserRepository;
import com.fieldops.fieldops_api.security.TokenService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public LoginResponseDTO login(LoginRequestDTO dto) {

        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() ->
                        new BusinessException("E-mail ou senha inválidos"));

        if (!user.getActive()) {
            throw new BusinessException("Usuário inativo");
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        dto.password(),
                        user.getPassword()
                );

        if (!passwordMatches) {
            throw new BusinessException("E-mail ou senha inválidos");
        }

        String token = tokenService.generateToken(user);

        return new LoginResponseDTO(
                token,
                "Bearer"
        );
    }
}