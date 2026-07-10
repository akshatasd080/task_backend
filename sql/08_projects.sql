-- =====================================================
-- File: 08_projects.sql
-- Description: Projects Table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.projects (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    project_name VARCHAR(200) NOT NULL,

    project_code VARCHAR(50),

    description TEXT,

    start_date DATE,

    end_date DATE,

    status VARCHAR(30) DEFAULT 'Pending',

    priority VARCHAR(20) DEFAULT 'Medium',

    created_by BIGINT NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_projects_created_by
        FOREIGN KEY (created_by)
        REFERENCES task_management.users(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_project_code
        UNIQUE(company_id, project_code)

);