package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.entities.Inspection;
import com.fieldops.fieldops_api.entities.InspectionAnswer;
import com.fieldops.fieldops_api.entities.InspectionEvidence;
import com.fieldops.fieldops_api.entities.InspectionStatus;
import com.fieldops.fieldops_api.entities.NonConformity;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.repositories.InspectionAnswerRepository;
import com.fieldops.fieldops_api.repositories.InspectionEvidenceRepository;
import com.fieldops.fieldops_api.repositories.NonConformityRepository;
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

/**
 * Evidências fotográficas (RN-045 a RN-051).
 *
 * Uma evidência pertence a uma resposta do checklist ou a uma não
 * conformidade. O envio é idempotente: o mesmo operationId nunca cria
 * duas evidências (RN-068).
 */
@Service
public class InspectionEvidenceService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    private static final List<String> ALLOWED_CONTENT_TYPES =
            List.of("image/jpeg", "image/png", "image/webp");

    private static final List<String> ALLOWED_EXTENSIONS =
            List.of(".jpg", ".jpeg", ".png", ".webp");

    private final InspectionEvidenceRepository evidenceRepository;
    private final InspectionAnswerRepository answerRepository;
    private final NonConformityRepository nonConformityRepository;
    private final AuditLogService auditLogService;
    private final Path uploadPath;

    public InspectionEvidenceService(
            InspectionEvidenceRepository evidenceRepository,
            InspectionAnswerRepository answerRepository,
            NonConformityRepository nonConformityRepository,
            AuditLogService auditLogService,
            @Value("${file.upload-dir:uploads}") String uploadDir) {

        this.evidenceRepository = evidenceRepository;
        this.answerRepository = answerRepository;
        this.nonConformityRepository = nonConformityRepository;
        this.auditLogService = auditLogService;

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

    /* ------------------------------------------------------------------ */
    /* ENVIO                                                              */
    /* ------------------------------------------------------------------ */

    @Transactional
    public InspectionEvidence upload(
            Long answerId,
            MultipartFile file,
            String operationId) {

        InspectionEvidence existing = findByOperation(operationId);

        if (existing != null) {
            return existing;
        }

        validateFile(file);

        InspectionAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Resposta não encontrada: " + answerId));

        Inspection inspection = answer.getInspection();

        requireResponsibleTechnician(inspection);
        requireInProgress(inspection);

        InspectionEvidence evidence = store(file, operationId);

        evidence.setInspectionAnswer(answer);

        return saveAndAudit(
                evidence,
                inspection,
                "Evidência enviada para o item '"
                        + answer.getTemplateItem().getLabel() + "'"
        );
    }

    @Transactional
    public InspectionEvidence uploadForNonConformity(
            Long nonConformityId,
            MultipartFile file,
            String operationId) {

        InspectionEvidence existing = findByOperation(operationId);

        if (existing != null) {
            return existing;
        }

        validateFile(file);

        NonConformity nonConformity = nonConformityRepository
                .findById(nonConformityId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Não conformidade não encontrada: "
                                        + nonConformityId));

        Inspection inspection = nonConformity.getInspection();

        requireResponsibleTechnician(inspection);
        requireInProgress(inspection);

        InspectionEvidence evidence = store(file, operationId);

        evidence.setNonConformity(nonConformity);

        return saveAndAudit(
                evidence,
                inspection,
                "Evidência enviada para a não conformidade "
                        + nonConformity.getId()
        );
    }

    /* ------------------------------------------------------------------ */
    /* CONSULTA                                                           */
    /* ------------------------------------------------------------------ */

    @Transactional(readOnly = true)
    public List<InspectionEvidence> findByAnswer(Long answerId) {

        InspectionAnswer answer = answerRepository.findById(answerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Resposta não encontrada: " + answerId));

        requireReadAccess(answer.getInspection());

        return evidenceRepository.findByInspectionAnswerId(answerId);
    }

    @Transactional(readOnly = true)
    public List<InspectionEvidence> findByNonConformity(Long nonConformityId) {

        NonConformity nonConformity = nonConformityRepository
                .findById(nonConformityId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Não conformidade não encontrada: "
                                        + nonConformityId));

        requireReadAccess(nonConformity.getInspection());

        return evidenceRepository.findByNonConformityId(nonConformityId);
    }

    @Transactional(readOnly = true)
    public EvidenceFile getFile(Long evidenceId) {

        InspectionEvidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Evidência não encontrada: " + evidenceId));

        Inspection inspection = inspectionOf(evidence);

        requireReadAccess(inspection);

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
                        "O arquivo físico da evidência não foi encontrado: "
                                + storageKey);
            }

            byte[] content = Files.readAllBytes(filePath);

            return new EvidenceFile(
                    content,
                    evidence.getContentType(),
                    evidence.getOriginalFilename());

        } catch (NoSuchFileException e) {
            throw new IllegalStateException(
                    "O arquivo físico da evidência não foi encontrado: "
                            + storageKey,
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

    /* ------------------------------------------------------------------ */
    /* INTERNOS                                                           */
    /* ------------------------------------------------------------------ */

    private InspectionEvidence findByOperation(String operationId) {

        if (operationId == null || operationId.isBlank()) {
            return null;
        }

        return evidenceRepository
                .findByClientOperationId(operationId.trim())
                .orElse(null);
    }

    private void validateFile(MultipartFile file) {

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
    }

    /**
     * Grava o arquivo em disco com nome aleatório (RN-050) e devolve a
     * entidade ainda sem vínculo.
     */
    private InspectionEvidence store(MultipartFile file, String operationId) {

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

        InspectionEvidence evidence = new InspectionEvidence();

        evidence.setOriginalFilename(
                originalFilename == null || originalFilename.isBlank()
                        ? "imagem" + extension
                        : Paths.get(originalFilename).getFileName().toString());
        evidence.setStorageKey(storageKey);
        evidence.setContentType(file.getContentType());
        evidence.setUploadedAt(LocalDateTime.now());

        if (operationId != null && !operationId.isBlank()) {
            evidence.setClientOperationId(operationId.trim());
        }

        return evidence;
    }

    private InspectionEvidence saveAndAudit(
            InspectionEvidence evidence,
            Inspection inspection,
            String description) {

        Path stored = uploadPath.resolve(evidence.getStorageKey()).normalize();

        try {
            InspectionEvidence saved = evidenceRepository.save(evidence);

            auditLogService.record(
                    "CREATE",
                    "InspectionEvidence",
                    saved.getId(),
                    description + " (inspeção " + inspection.getId() + ")"
            );

            return saved;

        } catch (RuntimeException e) {
            // Evita deixar um arquivo órfão se o registro não for salvo.
            try {
                Files.deleteIfExists(stored);
            } catch (IOException ignored) {
                // A exceção original é mais importante.
            }

            throw e;
        }
    }

    private Inspection inspectionOf(InspectionEvidence evidence) {

        if (evidence.getInspectionAnswer() != null) {
            return evidence.getInspectionAnswer().getInspection();
        }

        if (evidence.getNonConformity() != null) {
            return evidence.getNonConformity().getInspection();
        }

        throw new IllegalStateException(
                "A evidência não está vinculada a uma resposta ou não conformidade.");
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

    private void requireResponsibleTechnician(Inspection inspection) {

        User user = getAuthenticatedUser();

        if (inspection == null
                || inspection.getTechnician() == null
                || !inspection.getTechnician().getId()
                        .equals(user.getId())) {
            throw new AccessDeniedException(
                    "Você não é o técnico responsável por esta inspeção.");
        }
    }

    private void requireInProgress(Inspection inspection) {

        if (inspection.getStatus() != InspectionStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Só é possível enviar evidências durante uma inspeção em andamento.");
        }
    }

    private void requireReadAccess(Inspection inspection) {

        User user = getAuthenticatedUser();

        if (inspection == null || user.getRole() == null) {
            throw new AccessDeniedException(
                    "Você não tem permissão para acessar esta evidência.");
        }

        String role = user.getRole().name();

        if ("ADMIN".equals(role) || "SUPERVISOR".equals(role)) {
            return;
        }

        if (inspection.getTechnician() != null
                && inspection.getTechnician().getId() != null
                && inspection.getTechnician().getId().equals(user.getId())) {
            return;
        }

        throw new AccessDeniedException(
                "Você não tem permissão para acessar esta evidência.");
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
