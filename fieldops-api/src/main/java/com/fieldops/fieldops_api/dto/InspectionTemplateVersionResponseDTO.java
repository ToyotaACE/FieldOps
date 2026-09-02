package com.fieldops.fieldops_api.dto;
import java.time.LocalDateTime;

public class InspectionTemplateVersionResponseDTO {

    private Long id;

    private Long templateId;

    private Integer versionNumber;

    private Boolean published;

    private LocalDateTime publishedAt;

    private LocalDateTime createdAt;

    public InspectionTemplateVersionResponseDTO() {
    }

    public InspectionTemplateVersionResponseDTO(
            Long id,
            Long templateId,
            Integer versionNumber,
            Boolean published,
            LocalDateTime publishedAt,
            LocalDateTime createdAt) {

        this.id = id;
        this.templateId = templateId;
        this.versionNumber = versionNumber;
        this.published = published;
        this.publishedAt = publishedAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}