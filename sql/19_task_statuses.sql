-- Expand task workflow statuses
ALTER TABLE task_management.tasks
    ALTER COLUMN status SET DEFAULT 'Backlog';

ALTER TABLE task_management.tasks
    DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE task_management.tasks
    ADD CONSTRAINT chk_status
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
    ));
