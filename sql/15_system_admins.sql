CREATE TABLE IF NOT EXISTS task_management.system_admins (

    id BIGSERIAL PRIMARY KEY,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(150) NOT NULL UNIQUE,

    phone VARCHAR(20),

    password VARCHAR(255) NOT NULL,

    profile_image TEXT,

    email_verified BOOLEAN NOT NULL DEFAULT TRUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    login_attempts INTEGER NOT NULL DEFAULT 0,

    account_locked_until TIMESTAMP,

    last_login TIMESTAMP,

    password_changed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);

CREATE INDEX idx_system_admin_email
ON task_management.system_admins(email);