const pool = require("../config/db");

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

module.exports = {
    getPermissionsByRoleId,
    logActivity,
    createNotification,
};
