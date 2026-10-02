package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionAnswer;
import com.fieldops.fieldops_api.entities.InspectionEvidence;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionEvidenceRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InspectionEvidenceService {

    private final InspectionEvidenceRepository evidenceRepository;
    private final InspectionAnswerRepository answerRepository;
    private final Path uploadPath;

    public InspectionEvidenceService(
            InspectionEvidenceRepository evidenceRepository,
            InspectionAnswerRepository answerRepository,
            @Value("${file.upload-dir:uploads}") String uploadDir) {

        this.evidenceRepository = evidenceRepository;
        this.answerRepository = answerRepository;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Não foi possível criar o diretório de evidências.", e);
        }
    }

    @Transactional
    public InspectionEvidence upload(Long answerId, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo não pode estar vazio.");
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !List.of("image/jpeg", "image/png", "image/webp")
                        .contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Formato inválido. Envie uma imagem JPEG, PNG ou WEBP.");
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "A imagem não pode ultrapassar 10 MB.");
        }

        InspectionAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() ->
                        new RuntimeException("Resposta não encontrada."));

        Inspection inspection = answer.getInspection();

        User user = getAuthenticatedUser();

        if (!inspection.getTechnician().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "Você não é o técnico responsável por esta inspeção.");
        }

        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Só é possível enviar evidências durante uma inspeção em andamento.");
        }

        if (!Boolean.TRUE.equals(
                answer.getTemplateItem().getRequiresEvidence())) {
            throw new IllegalStateException(
                    "Este item não exige evidências.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String storageKey = UUID.randomUUID() + extension;

        Path destination = uploadPath.resolve(storageKey).normalize();

        if (!destination.startsWith(uploadPath)) {
            throw new IllegalArgumentException("Nome de arquivo inválido.");
        }

        try {
            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Erro ao armazenar a evidência.", e);
        }

        InspectionEvidence evidence = new InspectionEvidence();
        evidence.setInspectionAnswer(answer);
        evidence.setOriginalFilename(
                originalFilename == null ? "imagem" : originalFilename);
        evidence.setStorageKey(storageKey);
        evidence.setContentType(contentType);
        evidence.setUploadedAt(LocalDateTime.now());

        return evidenceRepository.save(evidence);
    }

    public List<InspectionEvidence> findByAnswer(Long answerId) {

        InspectionAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() ->
                        new RuntimeException("Resposta não encontrada."));

        User user = getAuthenticatedUser();

        if (!inspectionBelongsToUser(answer.getInspection(), user)) {
            throw new AccessDeniedException(
                    "Você não tem permissão para consultar estas evidências.");
        }

        return evidenceRepository.findByInspectionAnswerId(answerId);
    }

    private User getAuthenticatedUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !(authentication.getPrincipal() instanceof User user)) {
            throw new AccessDeniedException("Usuário não autenticado.");
        }

        return user;
    }

    private boolean inspectionBelongsToUser(
            Inspection inspection, User user) {

        return user.getRole().name().equals("ADMIN")
                || user.getRole().name().equals("SUPERVISOR")
                || inspection.getTechnician().getId().equals(user.getId());
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }

        String extension = filename.substring(
                filename.lastIndexOf(".")).toLowerCase();

        if (!List.of(".jpg", ".jpeg", ".png", ".webp")
                .contains(extension)) {
            throw new IllegalArgumentException(
                    "Extensão de arquivo não permitida.");
        }

        return extension;
    }
}