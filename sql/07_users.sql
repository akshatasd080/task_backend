CREATE TABLE IF NOT EXISTS task_management.users (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    department_id BIGINT,

    role_id BIGINT NOT NULL,

    manager_id BIGINT,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(150) NOT NULL,

    phone VARCHAR(20),

    password VARCHAR(255) NOT NULL,

    profile_image TEXT,

    employee_code VARCHAR(50),

    designation VARCHAR(100),

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    login_attempts INTEGER NOT NULL DEFAULT 0,

    account_locked_until TIMESTAMP,

    last_login TIMESTAMP,

    password_changed_at TIMESTAMP,

    created_by BIGINT,

    updated_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    CONSTRAINT fk_users_company
        FOREIGN KEY(company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_users_department
        FOREIGN KEY(department_id)
        REFERENCES task_management.departments(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_users_role
        FOREIGN KEY(role_id)
        REFERENCES task_management.roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_users_manager
        FOREIGN KEY(manager_id)
        REFERENCES task_management.users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_company_email
        UNIQUE(company_id, email),

    CONSTRAINT uq_employee_code
        UNIQUE(company_id, employee_code)

);

CREATE INDEX idx_users_company
ON task_management.users(company_id);

CREATE INDEX idx_users_role
ON task_management.users(role_id);

CREATE INDEX idx_users_department
ON task_management.users(department_id);