-- =====================================================
-- File: 09_project_members.sql
-- Description: Project Members
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.project_members (

    id BIGSERIAL PRIMARY KEY,

    project_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pm_project
        FOREIGN KEY (project_id)
        REFERENCES task_management.projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pm_user
        FOREIGN KEY (user_id)
        REFERENCES task_management.users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_project_member
        UNIQUE(project_id, user_id)

);


