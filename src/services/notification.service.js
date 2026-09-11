const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");

const TASK_TYPES = ["task_assigned", "status_changed", "task_reassigned", "task_completed"];
const COMMENT_TYPES = ["comment_added"];

const typeList = (values) => values.map((v) => `'${v}'`).join(", ");

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

    if (query.search) {
        params.push(`%${query.search}%`);
        filters.push(`(n.title ILIKE $${params.length} OR n.message ILIKE $${params.length})`);
    }

    if (query.category === "tasks") {
        filters.push(`n.type IN (${typeList(TASK_TYPES)})`);
    } else if (query.category === "comments") {
        filters.push(`n.type IN (${typeList(COMMENT_TYPES)})`);
    } else if (query.category === "projects") {
        filters.push(`(n.type ILIKE 'project%' OR n.title ILIKE '%project%')`);
    } else if (query.category === "team") {
        filters.push(`(n.type ILIKE 'team%' OR n.title ILIKE '%team%' OR n.message ILIKE '%team%')`);
    } else if (query.category === "system") {
        filters.push(`(
            n.type IS NULL
            OR n.type IN ('info', 'system')
            OR (
                n.type NOT IN (${typeList([...TASK_TYPES, ...COMMENT_TYPES])})
                AND n.type NOT ILIKE 'project%'
                AND n.type NOT ILIKE 'team%'
            )
        )`);
    }

    if (query.joined === "7d") {
        filters.push("n.created_at >= NOW() - INTERVAL '7 days'");
    } else if (query.joined === "30d") {
        filters.push("n.created_at >= NOW() - INTERVAL '30 days'");
    } else if (query.joined === "year") {
        filters.push("n.created_at >= date_trunc('year', CURRENT_TIMESTAMP)");
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    const statsParams = [loggedInUser.id];
    const statsFilters = ["user_id = $1"];
    if (!isSystemAdmin(loggedInUser)) {
        statsParams.push(loggedInUser.companyId);
        statsFilters.push(`company_id = $${statsParams.length}`);
    }

    const statsResult = await pool.query(
        `
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE is_read = FALSE)::int AS unread,
            COUNT(*) FILTER (WHERE type IN (${typeList(TASK_TYPES)}))::int AS task_updates,
            COUNT(*) FILTER (WHERE type IN (${typeList(COMMENT_TYPES)}))::int AS comments,
            COUNT(*) FILTER (
                WHERE type ILIKE 'team%' OR title ILIKE '%team%' OR message ILIKE '%team%'
            )::int AS team_updates
        FROM task_management.notifications
        WHERE ${statsFilters.join(" AND ")}
        `,
        statsParams
    );

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM task_management.notifications n ${where}`,
        params
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

    const stats = statsResult.rows[0] || {};

    return {
        items: result.rows,
        unread_count: stats.unread || 0,
        stats,
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
