package com.fieldops.fieldops_api.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "template_items")
public class TemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private TemplateSection section;

    @Column(nullable = false, length = 300)
    private String label;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_type", nullable = false, length = 30)
    private ResponseType responseType;

    @Column(nullable = false)
    private Boolean required = false;

    @Column(name = "requires_observation_on_nonconformity", nullable = false)
    private Boolean requiresObservationOnNonconformity = false;

    @Column(name = "critical_on_nonconformity", nullable = false)
    private Boolean criticalOnNonconformity = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (required == null) {
            required = false;
        }

        if (requiresObservationOnNonconformity == null) {
            requiresObservationOnNonconformity = false;
        }

        if (criticalOnNonconformity == null) {
            criticalOnNonconformity = false;
        }
    }

    public Long getId() {
        return id;
    }

    public TemplateSection getSection() {
        return section;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public ResponseType getResponseType() {
        return responseType;
    }

    public Boolean getRequired() {
        return required;
    }

    public Boolean getRequiresObservationOnNonconformity() {
        return requiresObservationOnNonconformity;
    }

    public Boolean getCriticalOnNonconformity() {
        return criticalOnNonconformity;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setSection(TemplateSection section) {
        this.section = section;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setResponseType(ResponseType responseType) {
        this.responseType = responseType;
    }

    public void setRequired(Boolean required) {
        this.required = required;
    }

    public void setRequiresObservationOnNonconformity(
            Boolean requiresObservationOnNonconformity) {

        this.requiresObservationOnNonconformity =
                requiresObservationOnNonconformity;
    }

    public void setCriticalOnNonconformity(
            Boolean criticalOnNonconformity) {

        this.criticalOnNonconformity =
                criticalOnNonconformity;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}