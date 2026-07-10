-- =====================================================
-- File: 11_task_comments.sql
-- Description: Task Comments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.task_comments (

    id BIGSERIAL PRIMARY KEY,

    task_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    comment TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_comment_task
        FOREIGN KEY (task_id)
        REFERENCES task_management.tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES task_management.users(id)
        ON DELETE CASCADE

);