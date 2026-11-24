package com.fieldops.fieldops_api.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Registro de uma operação enviada pelo aplicativo (outbox).
 *
 * O identificador da operação (UUID gerado no dispositivo) é único: ao
 * receber novamente a mesma operação o servidor devolve o resultado já
 * gravado, sem reaplicar a alteração (RN-067 / RN-068).
 */
@Entity
@Table(
    name = "sync_operations",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_sync_operation_id",
        columnNames = "operation_id"
    )
)
public class SyncOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_id", nullable = false, length = 64)
    private String operationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "inspection_id")
    private Long inspectionId;

    // APPLIED ou REJECTED
    @Column(nullable = false, length = 20)
    private String result;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(length = 1000)
    private String message;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    @PrePersist
    public void prePersist() {
        if (processedAt == null) {
            processedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }

    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getInspectionId() { return inspectionId; }
    public void setInspectionId(Long inspectionId) { this.inspectionId = inspectionId; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}