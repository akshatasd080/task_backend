-- =====================================================
-- File: 16_alter_for_crm.sql
-- Description: CRM enhancements for multi-company tasks
-- Safe to re-run where IF EXISTS / IF NOT EXISTS used
-- =====================================================

-- -----------------------------------------------------
-- Tasks: optional project, created_by, completed_at
-- Status/Priority aligned to product requirements
-- -----------------------------------------------------

ALTER TABLE task_management.tasks
    ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE task_management.tasks
    ADD COLUMN IF NOT EXISTS created_by BIGINT;

ALTER TABLE task_management.tasks
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_task_created_by'
    ) THEN
        ALTER TABLE task_management.tasks
            ADD CONSTRAINT fk_task_created_by
            FOREIGN KEY (created_by)
            REFERENCES task_management.users(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

ALTER TABLE task_management.tasks
    DROP CONSTRAINT IF EXISTS chk_priority;

ALTER TABLE task_management.tasks
    ADD CONSTRAINT chk_priority
    CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));

ALTER TABLE task_management.tasks
    DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE task_management.tasks
    ADD CONSTRAINT chk_status
    CHECK (status IN ('Todo', 'In Progress', 'On Hold', 'Completed', 'Cancelled'));

-- Migrate legacy values if any
UPDATE task_management.tasks SET priority = 'Urgent' WHERE priority = 'Critical';
UPDATE task_management.tasks SET status = 'On Hold' WHERE status = 'Review';

-- -----------------------------------------------------
-- Projects: status values
-- -----------------------------------------------------

UPDATE task_management.projects
SET status = 'Planning'
WHERE status IS NULL OR status = 'Pending';

ALTER TABLE task_management.projects
    DROP CONSTRAINT IF EXISTS chk_project_status;

ALTER TABLE task_management.projects
    ADD CONSTRAINT chk_project_status
    CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'));

-- -----------------------------------------------------
-- Task comments: company_id for tenant isolation
-- -----------------------------------------------------

ALTER TABLE task_management.task_comments
    ADD COLUMN IF NOT EXISTS company_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_comment_company'
    ) THEN
        ALTER TABLE task_management.task_comments
            ADD CONSTRAINT fk_comment_company
            FOREIGN KEY (company_id)
            REFERENCES task_management.companies(id)
            ON DELETE CASCADE;
    END IF;
END $$;

UPDATE task_management.task_comments c
SET company_id = t.company_id
FROM task_management.tasks t
WHERE c.task_id = t.id
AND c.company_id IS NULL;

-- -----------------------------------------------------
-- Task attachments: company_id
-- -----------------------------------------------------

ALTER TABLE task_management.task_attachments
    ADD COLUMN IF NOT EXISTS company_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_attachment_company'
    ) THEN
        ALTER TABLE task_management.task_attachments
            ADD CONSTRAINT fk_attachment_company
            FOREIGN KEY (company_id)
            REFERENCES task_management.companies(id)
            ON DELETE CASCADE;
    END IF;
END $$;

UPDATE task_management.task_attachments a
SET company_id = t.company_id
FROM task_management.tasks t
WHERE a.task_id = t.id
AND a.company_id IS NULL;

-- -----------------------------------------------------
-- Notifications: type + related_task_id
-- -----------------------------------------------------

ALTER TABLE task_management.notifications
    ADD COLUMN IF NOT EXISTS type VARCHAR(50);

ALTER TABLE task_management.notifications
    ADD COLUMN IF NOT EXISTS related_task_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_notification_task'
    ) THEN
        ALTER TABLE task_management.notifications
            ADD CONSTRAINT fk_notification_task
            FOREIGN KEY (related_task_id)
            REFERENCES task_management.tasks(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- -----------------------------------------------------
-- Activity logs: old/new values for task history timeline
-- -----------------------------------------------------

ALTER TABLE task_management.activity_logs
    ADD COLUMN IF NOT EXISTS old_value TEXT;

ALTER TABLE task_management.activity_logs
    ADD COLUMN IF NOT EXISTS new_value TEXT;

-- -----------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tasks_company ON task_management.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON task_management.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON task_management.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON task_management.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON task_management.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON task_management.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ref ON task_management.activity_logs(module_name, reference_id);
