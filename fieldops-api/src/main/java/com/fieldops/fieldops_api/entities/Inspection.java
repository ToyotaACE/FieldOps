package com.fieldops.fieldops_api.entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_version_id", nullable = false)
    private InspectionTemplateVersion templateVersion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private InspectionSite site;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time", nullable = false)
    private LocalTime scheduledTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InspectionPriority priority = InspectionPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InspectionStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Instruções adicionais do supervisor (RN-025 / planejamento).
    @Column(columnDefinition = "TEXT")
    private String instructions;

    // Execução (RN-034 / RN-042): momento do dispositivo e do servidor.
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "started_at_device")
    private LocalDateTime startedAtDevice;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_at_device")
    private LocalDateTime completedAtDevice;

    // Localização no início e na conclusão (RN-061 / RN-062).
    @Column(name = "start_latitude")
    private Double startLatitude;

    @Column(name = "start_longitude")
    private Double startLongitude;

    @Column(name = "start_accuracy")
    private Double startAccuracy;

    @Column(name = "start_location_at")
    private LocalDateTime startLocationAt;

    @Column(name = "end_latitude")
    private Double endLatitude;

    @Column(name = "end_longitude")
    private Double endLongitude;

    @Column(name = "end_accuracy")
    private Double endAccuracy;

    @Column(name = "end_location_at")
    private LocalDateTime endLocationAt;

    // Cancelamento (RN-029).
    @Column(name = "cancel_reason", length = 1000)
    private String cancelReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by_name", length = 120)
    private String cancelledByName;

    // Revisão (RN-079 a RN-081).
    @Column(name = "review_started_at")
    private LocalDateTime reviewStartedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by_name", length = 120)
    private String reviewedByName;

    // Motivo da reprovação ou comentário da aprovação.
    @Column(name = "review_comment", length = 2000)
    private String reviewComment;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = InspectionStatus.SCHEDULED;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public InspectionTemplateVersion getTemplateVersion() {
        return templateVersion;
    }

    public void setTemplateVersion(InspectionTemplateVersion templateVersion) {
        this.templateVersion = templateVersion;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public InspectionSite getSite() {
        return site;
    }

    public void setSite(InspectionSite site) {
        this.site = site;
    }

    public Equipment getEquipment() {
        return equipment;
    }

    public void setEquipment(Equipment equipment) {
        this.equipment = equipment;
    }

    public User getTechnician() {
        return technician;
    }

    public void setTechnician(User technician) {
        this.technician = technician;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalTime getScheduledTime() { return scheduledTime; }

    public void setScheduledTime(LocalTime scheduledTime) { this.scheduledTime = scheduledTime; }

    public InspectionPriority getPriority() { return priority; }

    public void setPriority(InspectionPriority priority) { this.priority = priority; }

    public InspectionStatus getStatus() {
        return status;
    }

    public void setStatus(InspectionStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getStartedAtDevice() { return startedAtDevice; }
    public void setStartedAtDevice(LocalDateTime startedAtDevice) { this.startedAtDevice = startedAtDevice; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCompletedAtDevice() { return completedAtDevice; }
    public void setCompletedAtDevice(LocalDateTime completedAtDevice) { this.completedAtDevice = completedAtDevice; }

    public Double getStartLatitude() { return startLatitude; }
    public void setStartLatitude(Double startLatitude) { this.startLatitude = startLatitude; }

    public Double getStartLongitude() { return startLongitude; }
    public void setStartLongitude(Double startLongitude) { this.startLongitude = startLongitude; }

    public Double getStartAccuracy() { return startAccuracy; }
    public void setStartAccuracy(Double startAccuracy) { this.startAccuracy = startAccuracy; }

    public LocalDateTime getStartLocationAt() { return startLocationAt; }
    public void setStartLocationAt(LocalDateTime startLocationAt) { this.startLocationAt = startLocationAt; }

    public Double getEndLatitude() { return endLatitude; }
    public void setEndLatitude(Double endLatitude) { this.endLatitude = endLatitude; }

    public Double getEndLongitude() { return endLongitude; }
    public void setEndLongitude(Double endLongitude) { this.endLongitude = endLongitude; }

    public Double getEndAccuracy() { return endAccuracy; }
    public void setEndAccuracy(Double endAccuracy) { this.endAccuracy = endAccuracy; }

    public LocalDateTime getEndLocationAt() { return endLocationAt; }
    public void setEndLocationAt(LocalDateTime endLocationAt) { this.endLocationAt = endLocationAt; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancelledByName() { return cancelledByName; }
    public void setCancelledByName(String cancelledByName) { this.cancelledByName = cancelledByName; }

    public LocalDateTime getReviewStartedAt() { return reviewStartedAt; }
    public void setReviewStartedAt(LocalDateTime reviewStartedAt) { this.reviewStartedAt = reviewStartedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String reviewedByName) { this.reviewedByName = reviewedByName; }

    public String getReviewComment() { return reviewComment; }
    public void setReviewComment(String reviewComment) { this.reviewComment = reviewComment; }
}