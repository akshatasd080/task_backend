-- =====================================================
-- File: 02_companies.sql
-- Description: Companies (tenants) table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.companies (

    id BIGSERIAL PRIMARY KEY,

    company_name VARCHAR(150) NOT NULL,

    company_code VARCHAR(20) NOT NULL,

    email VARCHAR(150) NOT NULL,

    phone VARCHAR(20),

    address TEXT,

    logo_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT,

    updated_by BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    CONSTRAINT uq_companies_code UNIQUE (company_code),

    CONSTRAINT uq_companies_email UNIQUE (email)

);

CREATE INDEX IF NOT EXISTS idx_companies_active
ON task_management.companies(is_active)
WHERE deleted_at IS NULL;
