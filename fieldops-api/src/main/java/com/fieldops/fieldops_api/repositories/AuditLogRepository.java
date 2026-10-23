
package com.fieldops.fieldops_api.repositories;

import com.fieldops.fieldops_api.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long>,
                JpaSpecificationExecutor<AuditLog> {
}
