-- =====================================================
-- File: 17_seed_permissions.sql
-- Description: Master permissions for RBAC
-- =====================================================

INSERT INTO task_management.permissions (permission_name, module_name, description)
VALUES
    ('company.view', 'company', 'View company settings'),
    ('company.update', 'company', 'Update company settings'),
    ('company.manage', 'company', 'Full company management'),

    ('department.create', 'department', 'Create departments'),
    ('department.view', 'department', 'View departments'),
    ('department.update', 'department', 'Update departments'),
    ('department.delete', 'department', 'Delete departments'),

    ('user.create', 'user', 'Create users'),
    ('user.view', 'user', 'View users'),
    ('user.update', 'user', 'Update users'),
    ('user.delete', 'user', 'Delete users'),
    ('manage_users', 'user', 'Manage company users'),

    ('role.create', 'role', 'Create roles'),
    ('role.view', 'role', 'View roles'),
    ('role.update', 'role', 'Update roles'),
    ('role.delete', 'role', 'Delete roles'),
    ('manage_roles', 'role', 'Manage roles and permissions'),

    ('designation.view', 'designation', 'View designations'),
    ('designation.create', 'designation', 'Create designations'),
    ('designation.update', 'designation', 'Update designations'),
    ('designation.delete', 'designation', 'Delete designations'),

    ('project.create', 'project', 'Create projects'),
    ('project.view', 'project', 'View projects'),
    ('project.update', 'project', 'Update projects'),
    ('project.delete', 'project', 'Delete projects'),

    ('task.create', 'task', 'Create tasks'),
    ('task.view', 'task', 'View tasks'),
    ('task.update', 'task', 'Update tasks'),
    ('task.delete', 'task', 'Delete tasks'),
    ('task.assign', 'task', 'Assign / reassign tasks'),
    ('task.change_status', 'task', 'Change task status'),
    ('task.change_priority', 'task', 'Change task priority'),
    ('view_all_company_tasks', 'task', 'View all company tasks'),

    ('comment.create', 'comment', 'Add comments'),
    ('comment.view', 'comment', 'View comments'),
    ('comment.edit_own', 'comment', 'Edit own comments'),
    ('comment.delete_own', 'comment', 'Delete own comments'),

    ('attachment.upload', 'attachment', 'Upload attachments'),
    ('attachment.view', 'attachment', 'View attachments'),
    ('attachment.delete', 'attachment', 'Delete attachments'),

    ('notification.view', 'notification', 'View notifications'),

    ('dashboard.view', 'dashboard', 'View dashboard'),
    ('reports.view', 'reports', 'View reports')
ON CONFLICT (permission_name) DO NOTHING;
