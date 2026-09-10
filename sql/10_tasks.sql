-- =====================================================
-- File: 10_tasks.sql
-- Description: Tasks Table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.tasks (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    project_id BIGINT NOT NULL,

    parent_task_id BIGINT,

    assigned_by BIGINT NOT NULL,

    assigned_to BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    priority VARCHAR(20) DEFAULT 'Medium',

    status VARCHAR(30) DEFAULT 'Backlog',

    progress INTEGER DEFAULT 0,

    start_date DATE,

    due_date DATE,

    estimated_hours DECIMAL(5,2),

    actual_hours DECIMAL(5,2),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_project
        FOREIGN KEY (project_id)
        REFERENCES task_management.projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_parent
        FOREIGN KEY (parent_task_id)
        REFERENCES task_management.tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_assigned_by
        FOREIGN KEY (assigned_by)
        REFERENCES task_management.users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_task_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES task_management.users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_progress
        CHECK (progress BETWEEN 0 AND 100),

    CONSTRAINT chk_priority
        CHECK (priority IN ('Low','Medium','High','Critical')),

    CONSTRAINT chk_status
        CHECK (status IN (
            'Backlog',
            'Todo',
            'In Progress',
            'On Hold',
            'Blocked',
            'In Review',
            'Changes Requested',
            'Completed',
            'Cancelled'
        ))

);