
package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionAnswer;
import com.fieldops.fieldops_api.entities.InspectionEvidence;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionEvidenceRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InspectionEvidenceService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private static final List<String> ALLOWED_CONTENT_TYPES =
            List.of("image/jpeg", "image/png", "image/webp");

    private static final List<String> ALLOWED_EXTENSIONS =
            List.of(".jpg", ".jpeg", ".png", ".webp");

    private final InspectionEvidenceRepository evidenceRepository;
    private final InspectionAnswerRepository answerRepository;
    private final Path uploadPath;

    public InspectionEvidenceService(
            InspectionEvidenceRepository evidenceRepository,
            InspectionAnswerRepository answerRepository,
            @Value("${file.upload-dir:uploads}") String uploadDir) {

        this.evidenceRepository = evidenceRepository;
        this.answerRepository = answerRepository;

        this.uploadPath = Paths.get(uploadDir)
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Não foi possível criar o diretório de evidências: "
                            + this.uploadPath,
                    e);
        }
    }

    @Transactional
    public InspectionEvidence upload(Long answerId, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "O arquivo não pode estar vazio.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "A imagem não pode ultrapassar 10 MB.");
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(
                        contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Formato inválido. Envie uma imagem JPEG, PNG ou WEBP.");
        }

        InspectionAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Resposta não encontrada: " + answerId));

        // A transação mantém as entidades relacionadas acessíveis.
        Inspection inspection = answer.getInspection();

        if (inspection == null) {
            throw new IllegalStateException(
                    "A resposta não está vinculada a uma inspeção.");
        }

        User user = getAuthenticatedUser();

        if (inspection.getTechnician() == null
                || !inspection.getTechnician().getId()
                        .equals(user.getId())) {
            throw new AccessDeniedException(
                    "Você não é o técnico responsável por esta inspeção.");
        }

        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Só é possível enviar evidências durante uma inspeção em andamento.");
        }

        if (answer.getTemplateItem() == null
                || !Boolean.TRUE.equals(
                        answer.getTemplateItem().getRequiresEvidence())) {
            throw new IllegalStateException(
                    "Este item não exige evidências.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String storageKey = UUID.randomUUID() + extension;

        Path destination = uploadPath.resolve(storageKey).normalize();

        if (!destination.startsWith(uploadPath)) {
            throw new IllegalArgumentException(
                    "Caminho de arquivo inválido.");
        }

        try {
            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Erro ao armazenar a evidência no diretório configurado.",
                    e);
        }

        try {
            InspectionEvidence evidence = new InspectionEvidence();
            evidence.setInspectionAnswer(answer);
            evidence.setOriginalFilename(
                    originalFilename == null || originalFilename.isBlank()
                            ? "imagem" + extension
                            : Paths.get(originalFilename).getFileName().toString());
            evidence.setStorageKey(storageKey);
            evidence.setContentType(contentType);
            evidence.setUploadedAt(LocalDateTime.now());

            return evidenceRepository.save(evidence);
        } catch (RuntimeException e) {
            // Evita deixar um arquivo órfão se o registro não for salvo.
            try {
                Files.deleteIfExists(destination);
            } catch (IOException ignored) {
                // A exceção original é mais importante.
            }
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<InspectionEvidence> findByAnswer(Long answerId) {

        InspectionAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Resposta não encontrada: " + answerId));

        Inspection inspection = answer.getInspection();
        User user = getAuthenticatedUser();

        if (inspection == null
                || !inspectionBelongsToUser(inspection, user)) {
            throw new AccessDeniedException(
                    "Você não tem permissão para consultar estas evidências.");
        }

        return evidenceRepository.findByInspectionAnswerId(answerId);
    }

    @Transactional(readOnly = true)
    public EvidenceFile getFile(Long evidenceId) {

        InspectionEvidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Evidência não encontrada: " + evidenceId));

        // A transação permanece aberta enquanto acessamos as relações lazy.
        InspectionAnswer answer = evidence.getInspectionAnswer();

        if (answer == null) {
            throw new IllegalStateException(
                    "A evidência não está vinculada a uma resposta.");
        }

        Inspection inspection = answer.getInspection();
        User user = getAuthenticatedUser();

        if (inspection == null
                || !inspectionBelongsToUser(inspection, user)) {
            throw new AccessDeniedException(
                    "Você não tem permissão para visualizar esta evidência.");
        }

        String storageKey = evidence.getStorageKey();

        if (storageKey == null || storageKey.isBlank()) {
            throw new IllegalStateException(
                    "A evidência não possui uma chave de armazenamento.");
        }

        Path filePath = uploadPath.resolve(storageKey).normalize();

        if (!filePath.startsWith(uploadPath)) {
            throw new IllegalArgumentException(
                    "Caminho de evidência inválido.");
        }

        try {
            if (!Files.isRegularFile(filePath)) {
                throw new IllegalStateException(
                        "O arquivo físico da evidência não foi encontrado. "
                                + "Diretório configurado: " + uploadPath
                                + ". Chave do arquivo: " + storageKey
                                + ". Verifique se o arquivo existe nesse diretório.");
            }

            byte[] content = Files.readAllBytes(filePath);

            return new EvidenceFile(
                    content,
                    evidence.getContentType(),
                    evidence.getOriginalFilename());

        } catch (NoSuchFileException e) {
            throw new IllegalStateException(
                    "O arquivo físico da evidência não foi encontrado. "
                            + "Diretório configurado: " + uploadPath
                            + ". Chave do arquivo: " + storageKey,
                    e);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Não foi possível ler o arquivo da evidência.",
                    e);
        }
    }

    public record EvidenceFile(
            byte[] content,
            String contentType,
            String filename) {
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !(authentication.getPrincipal() instanceof User user)) {
            throw new AccessDeniedException(
                    "Usuário não autenticado.");
        }

        return user;
    }

    private boolean inspectionBelongsToUser(
            Inspection inspection,
            User user) {

        if (user.getRole() == null) {
            return false;
        }

        String role = user.getRole().name();

        if ("ADMIN".equals(role) || "SUPERVISOR".equals(role)) {
            return true;
        }

        return inspection.getTechnician() != null
                && inspection.getTechnician().getId() != null
                && inspection.getTechnician().getId().equals(user.getId());
    }

    private String getExtension(String filename) {

        if (filename == null || filename.isBlank()) {
            return ".jpg";
        }

        String safeFilename = Paths.get(filename)
                .getFileName()
                .toString();

        int lastDot = safeFilename.lastIndexOf('.');

        if (lastDot < 0) {
            return ".jpg";
        }

        String extension = safeFilename.substring(lastDot).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Extensão de arquivo não permitida.");
        }

        return extension;
    }
}
