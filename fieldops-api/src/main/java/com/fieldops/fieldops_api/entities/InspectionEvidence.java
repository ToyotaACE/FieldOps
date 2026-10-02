package com.fieldops.fieldops_api.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_evidences")
public class InspectionEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_answer_id", nullable = false)
    private InspectionAnswer inspectionAnswer;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false, unique = true)
    private String storageKey;

    private String contentType;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    public Long getId() {
        return id;
    }

    public InspectionAnswer getInspectionAnswer() {
        return inspectionAnswer;
    }

    public void setInspectionAnswer(InspectionAnswer inspectionAnswer) {
        this.inspectionAnswer = inspectionAnswer;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}