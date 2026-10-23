
package com.fieldops.fieldops_api.dto;

import java.time.LocalDateTime;

public record AuditLogResponseDTO(
    Long id,
    Long actorUserId,
    String actorName,
    String actorEmail,
    String action,
    String entityType,
    String entityId,
    String description,
    LocalDateTime createdAt
) {}
