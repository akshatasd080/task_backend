CREATE TABLE IF NOT EXISTS task_management.role_permissions (

    id BIGSERIAL PRIMARY KEY,

    role_id BIGINT NOT NULL,

    permission_id BIGINT NOT NULL,

    assigned_by BIGINT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rp_role
        FOREIGN KEY(role_id)
        REFERENCES task_management.roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_rp_permission
        FOREIGN KEY(permission_id)
        REFERENCES task_management.permissions(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_role_permission
        UNIQUE(role_id, permission_id)

);

CREATE INDEX idx_rp_role
ON task_management.role_permissions(role_id);

CREATE INDEX idx_rp_permission
ON task_management.role_permissions(permission_id);