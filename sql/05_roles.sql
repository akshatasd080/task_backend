CREATE TABLE IF NOT EXISTS task_management.roles (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    role_name VARCHAR(100) NOT NULL,

    description TEXT,

    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT,

    updated_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    CONSTRAINT fk_roles_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_company_role
        UNIQUE(company_id, role_name)

);

CREATE INDEX idx_roles_company
ON task_management.roles(company_id);