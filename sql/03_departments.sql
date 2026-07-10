CREATE TABLE IF NOT EXISTS task_management.departments (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    department_name VARCHAR(100) NOT NULL,

    department_code VARCHAR(20),

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT,

    updated_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    CONSTRAINT fk_department_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_department_name
        UNIQUE(company_id, department_name),

    CONSTRAINT uq_department_code
        UNIQUE(company_id, department_code)

);

CREATE INDEX idx_department_company
ON task_management.departments(company_id);