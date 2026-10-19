
package com.fieldops.fieldops_api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fieldops.fieldops_api.dto.LoginRequestDTO;
import com.fieldops.fieldops_api.dto.LoginResponseDTO;
import com.fieldops.fieldops_api.dto.RegisterRequestDTO;
import com.fieldops.fieldops_api.dto.UserResponseDTO;
import com.fieldops.fieldops_api.services.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO dto) {

        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO dto) {

        UserResponseDTO user = authService.register(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(user);
    }
}
