-- =====================================================
-- File: 18_seed_demo_company.sql
-- Description: Demo company + roles (users seeded via node script)
-- =====================================================

INSERT INTO task_management.companies
    (company_name, company_code, email, phone, address, is_active)
SELECT
    'Acme Technologies',
    'ACME',
    'admin@acme.com',
    '9876543210',
    '123 Business Park',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM task_management.companies WHERE company_code = 'ACME'
);

DO $$
DECLARE
    v_company_id BIGINT;
    v_role_admin BIGINT;
    v_role_manager BIGINT;
    v_role_lead BIGINT;
    v_role_employee BIGINT;
BEGIN
    SELECT id INTO v_company_id
    FROM task_management.companies
    WHERE company_code = 'ACME'
    LIMIT 1;

    IF v_company_id IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO task_management.roles (company_id, role_name, description, is_system, is_active)
    VALUES (v_company_id, 'Company Admin', 'Full company access', TRUE, TRUE)
    ON CONFLICT (company_id, role_name) DO NOTHING;

    INSERT INTO task_management.roles (company_id, role_name, description, is_system, is_active)
    VALUES (v_company_id, 'Manager', 'Manage projects and team tasks', TRUE, TRUE)
    ON CONFLICT (company_id, role_name) DO NOTHING;

    INSERT INTO task_management.roles (company_id, role_name, description, is_system, is_active)
    VALUES (v_company_id, 'Team Lead', 'Lead team and assign tasks', TRUE, TRUE)
    ON CONFLICT (company_id, role_name) DO NOTHING;

    INSERT INTO task_management.roles (company_id, role_name, description, is_system, is_active)
    VALUES (v_company_id, 'Employee', 'Work on assigned tasks', TRUE, TRUE)
    ON CONFLICT (company_id, role_name) DO NOTHING;

    SELECT id INTO v_role_admin FROM task_management.roles
    WHERE company_id = v_company_id AND role_name = 'Company Admin';

    SELECT id INTO v_role_manager FROM task_management.roles
    WHERE company_id = v_company_id AND role_name = 'Manager';

    SELECT id INTO v_role_lead FROM task_management.roles
    WHERE company_id = v_company_id AND role_name = 'Team Lead';

    SELECT id INTO v_role_employee FROM task_management.roles
    WHERE company_id = v_company_id AND role_name = 'Employee';

    INSERT INTO task_management.role_permissions (role_id, permission_id)
    SELECT v_role_admin, p.id
    FROM task_management.permissions p
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    INSERT INTO task_management.role_permissions (role_id, permission_id)
    SELECT v_role_manager, p.id
    FROM task_management.permissions p
    WHERE p.permission_name IN (
        'company.view',
        'department.view',
        'user.view',
        'role.view',
        'project.create', 'project.view', 'project.update',
        'task.create', 'task.view', 'task.update', 'task.assign',
        'task.change_status', 'task.change_priority', 'view_all_company_tasks',
        'comment.create', 'comment.view', 'comment.edit_own', 'comment.delete_own',
        'attachment.upload', 'attachment.view', 'attachment.delete',
        'notification.view', 'dashboard.view', 'reports.view'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    INSERT INTO task_management.role_permissions (role_id, permission_id)
    SELECT v_role_lead, p.id
    FROM task_management.permissions p
    WHERE p.permission_name IN (
        'user.view',
        'project.view',
        'task.create', 'task.view', 'task.update', 'task.assign',
        'task.change_status', 'task.change_priority', 'view_all_company_tasks',
        'comment.create', 'comment.view', 'comment.edit_own', 'comment.delete_own',
        'attachment.upload', 'attachment.view',
        'notification.view', 'dashboard.view'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    INSERT INTO task_management.role_permissions (role_id, permission_id)
    SELECT v_role_employee, p.id
    FROM task_management.permissions p
    WHERE p.permission_name IN (
        'project.view',
        'task.view', 'task.change_status',
        'comment.create', 'comment.view', 'comment.edit_own', 'comment.delete_own',
        'attachment.upload', 'attachment.view',
        'notification.view', 'dashboard.view'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;
