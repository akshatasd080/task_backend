const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");

const getNotificationsService = async (loggedInUser, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    const params = [loggedInUser.id];
    const filters = ["n.user_id = $1"];

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        filters.push(`n.company_id = $${params.length}`);
    }

    if (query.is_read === "true" || query.is_read === "false") {
        params.push(query.is_read === "true");
        filters.push(`n.is_read = $${params.length}`);
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM task_management.notifications n ${where}`,
        params
    );

    const unreadResult = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM task_management.notifications n
        WHERE n.user_id = $1 AND n.is_read = FALSE
        ${!isSystemAdmin(loggedInUser) ? "AND n.company_id = $2" : ""}
        `,
        isSystemAdmin(loggedInUser)
            ? [loggedInUser.id]
            : [loggedInUser.id, loggedInUser.companyId]
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
        `
        SELECT n.*
        FROM task_management.notifications n
        ${where}
        ORDER BY n.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
        `,
        params
    );

    return {
        items: result.rows,
        unread_count: unreadResult.rows[0].total,
        pagination: {
            page,
            limit,
            total: countResult.rows[0].total,
            totalPages: Math.ceil(countResult.rows[0].total / limit) || 1,
        },
    };
};

const markAsReadService = async (notificationId, loggedInUser) => {
    const result = await pool.query(
        `
        UPDATE task_management.notifications
        SET is_read = TRUE
        WHERE id = $1 AND user_id = $2
        RETURNING *
        `,
        [notificationId, loggedInUser.id]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Notification not found."), { statusCode: 404 });
    }

    return result.rows[0];
};

const markAllAsReadService = async (loggedInUser) => {
    const result = await pool.query(
        `
        UPDATE task_management.notifications
        SET is_read = TRUE
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING id
        `,
        [loggedInUser.id]
    );

    return { updated: result.rowCount };
};

const getUnreadCountService = async (loggedInUser) => {
    const result = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM task_management.notifications
        WHERE user_id = $1 AND is_read = FALSE
        `,
        [loggedInUser.id]
    );

    return { unread_count: result.rows[0].total };
};

module.exports = {
    getNotificationsService,
    markAsReadService,
    markAllAsReadService,
    getUnreadCountService,
};
