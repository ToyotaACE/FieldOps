
package com.fieldops.fieldops_api.services;

import com.fieldops.fieldops_api.dto.AuditLogResponseDTO;
import com.fieldops.fieldops_api.entities.AuditLog;
import com.fieldops.fieldops_api.entities.User;
import com.fieldops.fieldops_api.repositories.AuditLogRepository;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Locale;

@Service
public class AuditLogService {

    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(
            String action,
            String entityType,
            Object entityId,
            String description) {

        if (!StringUtils.hasText(action) ||
                !StringUtils.hasText(entityType)) {
            throw new IllegalArgumentException(
                "Ação e tipo de entidade são obrigatórios."
            );
        }

        AuditLog log = new AuditLog();
        log.setAction(action.trim().toUpperCase(Locale.ROOT));
        log.setEntityType(entityType.trim());
        log.setEntityId(
            entityId == null ? null : String.valueOf(entityId)
        );
        log.setDescription(sanitize(description));

        Authentication auth =
            SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof User user) {
            log.setActorUserId(user.getId());
            log.setActorName(user.getName());
            log.setActorEmail(user.getEmail());
        } else if (auth != null
                && auth.isAuthenticated()
                && auth.getPrincipal() instanceof String principal
                && !"anonymousUser".equals(principal)) {
            log.setActorName(principal);
        } else {
            log.setActorName("SYSTEM");
        }

        repository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponseDTO> search(
            String search,
            String action,
            String entityType,
            LocalDate from,
            LocalDate to,
            int page,
            int size) {

        if (page < 0) {
            throw new IllegalArgumentException(
                "Página não pode ser negativa."
            );
        }

        if (size < 1 || size > 200) {
            throw new IllegalArgumentException(
                "O tamanho deve estar entre 1 e 200."
            );
        }

        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException(
                "A data inicial não pode ser posterior à data final."
            );
        }

        Specification<AuditLog> spec =
            (root, query, cb) -> cb.conjunction();

        if (StringUtils.hasText(search)) {
            String pattern =
                "%" + search.trim().toLowerCase(Locale.ROOT) + "%";

            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("actorName")), pattern),
                cb.like(cb.lower(root.get("actorEmail")), pattern),
                cb.like(cb.lower(root.get("action")), pattern),
                cb.like(cb.lower(root.get("entityType")), pattern),
                cb.like(cb.lower(root.get("entityId")), pattern),
                cb.like(cb.lower(root.get("description")), pattern)
            ));
        }

        if (StringUtils.hasText(action)) {
            spec = spec.and((root, query, cb) ->
                cb.equal(
                    cb.upper(root.get("action")),
                    action.trim().toUpperCase(Locale.ROOT)
                )
            );
        }

        if (StringUtils.hasText(entityType)) {
            spec = spec.and((root, query, cb) ->
                cb.equal(
                    cb.lower(root.get("entityType")),
                    entityType.trim().toLowerCase(Locale.ROOT)
                )
            );
        }

        if (from != null) {
            LocalDateTime start = from.atStartOfDay();

            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(
                    root.get("createdAt"), start
                )
            );
        }

        if (to != null) {
            LocalDateTime end = to.atTime(LocalTime.MAX);

            spec = spec.and((root, query, cb) ->
                cb.lessThanOrEqualTo(
                    root.get("createdAt"), end
                )
            );
        }

        return repository.findAll(
            spec,
            PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
            )
        ).map(this::toDto);
    }

    private AuditLogResponseDTO toDto(AuditLog log) {
        return new AuditLogResponseDTO(
            log.getId(),
            log.getActorUserId(),
            log.getActorName(),
            log.getActorEmail(),
            log.getAction(),
            log.getEntityType(),
            log.getEntityId(),
            log.getDescription(),
            log.getCreatedAt()
        );
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }

        String safe = value.replaceAll(
            "(?i)(password|token|authorization|secret)\\s*[:=]\\s*[^,;\\s]+",
            "$1=[REDACTED]"
        );

        return safe.length() > 1000
            ? safe.substring(0, 1000)
            : safe;
    }
}
