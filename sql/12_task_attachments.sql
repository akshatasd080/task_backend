-- =====================================================
-- File: 12_task_attachments.sql
-- Description: Task Attachments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.task_attachments (

    id BIGSERIAL PRIMARY KEY,

    task_id BIGINT NOT NULL,

    uploaded_by BIGINT NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    file_path TEXT NOT NULL,

    file_size BIGINT,

    file_type VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_task
        FOREIGN KEY (task_id)
        REFERENCES task_management.tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attachment_user
        FOREIGN KEY (uploaded_by)
        REFERENCES task_management.users(id)
        ON DELETE CASCADE

);  