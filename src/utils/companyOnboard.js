const bcrypt = require("bcrypt");
const pool = require("../config/db");

const MANAGER_PERMS = [
    "company.view",
    "department.view",
    "user.view",
    "role.view",
    "project.create",
    "project.view",
    "project.update",
    "task.create",
    "task.view",
    "task.update",
    "task.assign",
    "task.change_status",
    "task.change_priority",
    "view_all_company_tasks",
    "comment.create",
    "comment.view",
    "comment.edit_own",
    "comment.delete_own",
    "attachment.upload",
    "attachment.view",
    "attachment.delete",
    "notification.view",
    "dashboard.view",
    "reports.view",
];

const LEAD_PERMS = [
    "user.view",
    "project.view",
    "task.create",
    "task.view",
    "task.update",
    "task.assign",
    "task.change_status",
    "task.change_priority",
    "view_all_company_tasks",
    "comment.create",
    "comment.view",
    "comment.edit_own",
    "comment.delete_own",
    "attachment.upload",
    "attachment.view",
    "notification.view",
    "dashboard.view",
];

const EMPLOYEE_PERMS = [
    "project.view",
    "task.view",
    "task.change_status",
    "comment.create",
    "comment.view",
    "comment.edit_own",
    "comment.delete_own",
    "attachment.upload",
    "attachment.view",
    "notification.view",
    "dashboard.view",
];

const assignPermissions = async (roleId, permissionNames, assignedBy, db = pool) => {
    if (!permissionNames) {
        await db.query(
            `
            INSERT INTO task_management.role_permissions (role_id, permission_id, assigned_by)
            SELECT $1, p.id, $2
            FROM task_management.permissions p
            ON CONFLICT (role_id, permission_id) DO UPDATE SET is_active = TRUE
            `,
            [roleId, assignedBy]
        );
        return;
    }

    await db.query(
        `
        INSERT INTO task_management.role_permissions (role_id, permission_id, assigned_by)
        SELECT $1, p.id, $2
        FROM task_management.permissions p
        WHERE p.permission_name = ANY($3::text[])
        ON CONFLICT (role_id, permission_id) DO UPDATE SET is_active = TRUE
        `,
        [roleId, assignedBy, permissionNames]
    );
};

const createRole = async (companyId, roleName, description, createdBy, db = pool) => {
    const result = await db.query(
        `
        INSERT INTO task_management.roles
        (company_id, role_name, description, is_system, is_active, created_by, updated_by)
        VALUES ($1, $2, $3, TRUE, TRUE, $4, $4)
        ON CONFLICT (company_id, role_name) DO UPDATE
        SET updated_at = CURRENT_TIMESTAMP
        RETURNING id, role_name
        `,
        [companyId, roleName, description, createdBy]
    );
    return result.rows[0];
};

/**
 * Create default roles + Company Admin user for a new company.
 */
const onboardCompanyDefaults = async ({
    companyId,
    adminEmail,
    adminPassword,
    adminFirstName = "Company",
    adminLastName = "Admin",
    adminPhone = null,
    createdBy,
    db = pool,
}) => {
    const adminRole = await createRole(
        companyId,
        "Company Admin",
        "Full company access",
        createdBy,
        db
    );
    const managerRole = await createRole(
        companyId,
        "Manager",
        "Manage projects and team tasks",
        createdBy,
        db
    );
    const leadRole = await createRole(
        companyId,
        "Team Lead",
        "Lead team and assign tasks",
        createdBy,
        db
    );
    const employeeRole = await createRole(
        companyId,
        "Employee",
        "Work on assigned tasks",
        createdBy,
        db
    );

    await assignPermissions(adminRole.id, null, createdBy, db);
    await assignPermissions(managerRole.id, MANAGER_PERMS, createdBy, db);
    await assignPermissions(leadRole.id, LEAD_PERMS, createdBy, db);
    await assignPermissions(employeeRole.id, EMPLOYEE_PERMS, createdBy, db);

    const emailCheck = await db.query(
        `
        SELECT id FROM task_management.users
        WHERE company_id = $1 AND email = $2 AND deleted_at IS NULL
        `,
        [companyId, adminEmail]
    );

    if (emailCheck.rows.length > 0) {
        throw Object.assign(
            new Error("Company admin email already exists in this company."),
            { statusCode: 400 }
        );
    }

    const globalEmail = await db.query(
        `
        SELECT id FROM task_management.users
        WHERE email = $1 AND deleted_at IS NULL
        `,
        [adminEmail]
    );

    if (globalEmail.rows.length > 0) {
        throw Object.assign(
            new Error("Admin email is already registered. Use a different email."),
            { statusCode: 400 }
        );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const userResult = await db.query(
        `
        INSERT INTO task_management.users
        (
            company_id, role_id, first_name, last_name,
            email, phone, password, is_active, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $8)
        RETURNING
            id, company_id, role_id, first_name, last_name,
            email, phone, is_active, created_at
        `,
        [
            companyId,
            adminRole.id,
            adminFirstName,
            adminLastName,
            adminEmail,
            adminPhone,
            hashedPassword,
            createdBy,
        ]
    );

    return {
        roles: [adminRole, managerRole, leadRole, employeeRole],
        company_admin: userResult.rows[0],
    };
};

/** Permissions allowed for platform Super Admin only */
const SUPER_ADMIN_PERMISSIONS = [
    "company.view",
    "company.create",
    "company.update",
    "company.delete",
    "company.manage",
];

module.exports = {
    onboardCompanyDefaults,
    SUPER_ADMIN_PERMISSIONS,
};
