-- Task workflow: assignee owns status; admins may override.
INSERT INTO task_management.permissions (permission_name, module_name, description)
VALUES (
    'task.override_status',
    'task',
    'Override assignee-owned status workflow (mark another user''s stage complete)'
)
ON CONFLICT (permission_name) DO NOTHING;

INSERT INTO task_management.role_permissions (role_id, permission_id, assigned_by)
SELECT r.id, p.id, COALESCE(r.created_by, r.updated_by)
FROM task_management.roles r
CROSS JOIN task_management.permissions p
WHERE r.role_name = 'Company Admin'
  AND r.deleted_at IS NULL
  AND p.permission_name = 'task.override_status'
ON CONFLICT (role_id, permission_id) DO UPDATE SET is_active = TRUE;
