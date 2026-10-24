
package com.fieldops.fieldops_api.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fieldops.fieldops_api.dto.LoginRequestDTO;
import com.fieldops.fieldops_api.dto.LoginResponseDTO;
import com.fieldops.fieldops_api.dto.RegisterRequestDTO;
import com.fieldops.fieldops_api.dto.UserResponseDTO;
import com.fieldops.fieldops_api.dto.MyProfileUpdateDTO;
import com.fieldops.fieldops_api.dto.MyPasswordUpdateDTO;
import com.fieldops.fieldops_api.entities.User;
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

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();

        UserResponseDTO response = new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponseDTO> updateMe(
            Authentication authentication,
            @Valid @RequestBody MyProfileUpdateDTO dto) {

        User user = (User) authentication.getPrincipal();

        return ResponseEntity.ok(
                authService.updateMyProfile(user, dto)
        );
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody MyPasswordUpdateDTO dto) {

        User user = (User) authentication.getPrincipal();

        authService.changeMyPassword(user, dto);

        return ResponseEntity.noContent().build();
    }
}
