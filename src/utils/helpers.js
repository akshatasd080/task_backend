const pool = require("../config/db");

const COMPANY_DEACTIVATED_MESSAGE =
    "Your company has been deactivated. Please contact Super Admin.";

/**
 * Load company + user access flags for a company user session.
 */
const getCompanyUserAccess = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            u.id AS user_id,
            u.is_active AS user_is_active,
            u.deleted_at AS user_deleted_at,
            u.company_id,
            c.is_active AS company_is_active,
            c.deleted_at AS company_deleted_at
        FROM task_management.users u
        LEFT JOIN task_management.companies c
            ON c.id = u.company_id
        WHERE u.id = $1
        `,
        [userId]
    );

    return result.rows[0] || null;
};

/**
 * Block inactive / deleted company users. Super Admin is not checked here.
 */
const assertCompanyUserCanAccess = (access) => {
    if (!access || access.user_deleted_at || access.user_is_active !== true) {
        const error = new Error("Invalid or expired token.");
        error.statusCode = 401;
        throw error;
    }

    if (access.company_deleted_at || access.company_is_active !== true) {
        const error = new Error(COMPANY_DEACTIVATED_MESSAGE);
        error.statusCode = 401;
        throw error;
    }
};

/**
 * Load permission names for a company user role.
 */
const getPermissionsByRoleId = async (roleId) => {
    if (!roleId) return [];

    const result = await pool.query(
        `
        SELECT p.permission_name
        FROM task_management.role_permissions rp
        INNER JOIN task_management.permissions p
            ON p.id = rp.permission_id
        WHERE rp.role_id = $1
          AND rp.is_active = TRUE
        ORDER BY p.permission_name ASC
        `,
        [roleId]
    );

    return result.rows.map((row) => row.permission_name);
};

/**
 * Write activity / task history entry.
 */
const logActivity = async ({
    companyId,
    userId,
    moduleName,
    action,
    referenceId = null,
    description = null,
    oldValue = null,
    newValue = null,
    ipAddress = null,
}) => {
    await pool.query(
        `
        INSERT INTO task_management.activity_logs
        (
            company_id,
            user_id,
            module_name,
            action,
            reference_id,
            description,
            old_value,
            new_value,
            ip_address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
            companyId,
            userId,
            moduleName,
            action,
            referenceId,
            description,
            oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
            newValue !== null && newValue !== undefined ? String(newValue) : null,
            ipAddress,
        ]
    );
};

/**
 * Create an in-app notification.
 */
const createNotification = async ({
    companyId,
    userId,
    title,
    message,
    type = "info",
    relatedTaskId = null,
}) => {
    if (!userId) return null;

    const result = await pool.query(
        `
        INSERT INTO task_management.notifications
        (
            company_id,
            user_id,
            title,
            message,
            type,
            related_task_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [companyId, userId, title, message, type, relatedTaskId]
    );

    return result.rows[0];
};

/**
 * SQL snippet: current user can see own tasks plus tasks assigned to their reportees.
 * `userParam` is a numbered placeholder like "$2".
 */
const teamTaskAccessSql = (userParam, taskAlias = "t") =>
    `(
        ${taskAlias}.assigned_to = ${userParam}
        OR ${taskAlias}.created_by = ${userParam}
        OR ${taskAlias}.assigned_by = ${userParam}
        OR EXISTS (
            SELECT 1
            FROM task_management.users reportees
            WHERE reportees.id = ${taskAlias}.assigned_to
              AND reportees.manager_id = ${userParam}
              AND reportees.deleted_at IS NULL
        )
    )`;

module.exports = {
    COMPANY_DEACTIVATED_MESSAGE,
    getCompanyUserAccess,
    assertCompanyUserCanAccess,
    getPermissionsByRoleId,
    logActivity,
    createNotification,
    teamTaskAccessSql,
};
