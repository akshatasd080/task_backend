const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");
const { teamTaskAccessSql } = require("../utils/helpers");

const getDashboardService = async (loggedInUser) => {
    const companyId = isSystemAdmin(loggedInUser) ? null : Number(loggedInUser.companyId);
    const userId = Number(loggedInUser.id);
    const canViewAll =
        isSystemAdmin(loggedInUser) ||
        (loggedInUser.permissions || []).includes("view_all_company_tasks");

    const baseParams = [];
    const baseFilters = ["is_active = TRUE"];

    if (companyId) {
        baseParams.push(companyId);
        baseFilters.push(`company_id = $${baseParams.length}`);
    }

    if (!canViewAll) {
        baseParams.push(userId);
        baseFilters.push(
            `(assigned_to = $${baseParams.length} OR created_by = $${baseParams.length} OR assigned_by = $${baseParams.length} OR assigned_to IN (
                SELECT id FROM task_management.users
                WHERE manager_id = $${baseParams.length} AND deleted_at IS NULL
            ))`
        );
    }

    const where = `WHERE ${baseFilters.join(" AND ")}`;

    const statsResult = await pool.query(
        `
        SELECT
            COUNT(*)::int AS total_tasks,
            COUNT(*) FILTER (WHERE status = 'Backlog')::int AS backlog,
            COUNT(*) FILTER (WHERE status = 'Todo')::int AS todo,
            COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress,
            COUNT(*) FILTER (WHERE status = 'On Hold')::int AS on_hold,
            COUNT(*) FILTER (WHERE status = 'Blocked')::int AS blocked,
            COUNT(*) FILTER (WHERE status = 'In Review')::int AS in_review,
            COUNT(*) FILTER (WHERE status = 'Changes Requested')::int AS changes_requested,
            COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed,
            COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
            COUNT(*) FILTER (
                WHERE due_date < CURRENT_DATE
                AND status NOT IN ('Completed', 'Cancelled')
            )::int AS overdue,
            COUNT(*) FILTER (WHERE priority IN ('High', 'Urgent'))::int AS high_priority
        FROM task_management.tasks
        ${where}
        `,
        baseParams
    );

    const personalParams = [];
    const personalFilters = ["is_active = TRUE"];

    if (companyId) {
        personalParams.push(companyId);
        personalFilters.push(`company_id = $${personalParams.length}`);
    }

    personalParams.push(userId);
    const userParam = `$${personalParams.length}`;

    const personalResult = await pool.query(
        `
        SELECT
            COUNT(*) FILTER (WHERE assigned_to = ${userParam})::int AS my_tasks,
            COUNT(*) FILTER (WHERE created_by = ${userParam})::int AS tasks_created,
            COUNT(*) FILTER (WHERE assigned_by = ${userParam})::int AS tasks_assigned
        FROM task_management.tasks
        WHERE ${personalFilters.join(" AND ")}
        `,
        personalParams
    );

    const statusChart = await pool.query(
        `
        SELECT status, COUNT(*)::int AS count
        FROM task_management.tasks
        ${where}
        GROUP BY status
        ORDER BY CASE status
            WHEN 'Backlog' THEN 1
            WHEN 'Todo' THEN 2
            WHEN 'In Progress' THEN 3
            WHEN 'On Hold' THEN 4
            WHEN 'Blocked' THEN 5
            WHEN 'In Review' THEN 6
            WHEN 'Changes Requested' THEN 7
            WHEN 'Completed' THEN 8
            WHEN 'Cancelled' THEN 9
            ELSE 99
        END
        `,
        baseParams
    );

    const priorityChart = await pool.query(
        `
        SELECT priority, COUNT(*)::int AS count
        FROM task_management.tasks
        ${where}
        GROUP BY priority
        ORDER BY priority
        `,
        baseParams
    );

    const listParams = [];
    const listFilters = ["t.is_active = TRUE"];

    if (companyId) {
        listParams.push(companyId);
        listFilters.push(`t.company_id = $${listParams.length}`);
    }

    if (!canViewAll) {
        listParams.push(userId);
        listFilters.push(teamTaskAccessSql(`$${listParams.length}`));
    }

    const listWhere = listFilters.join(" AND ");

    const recentTasks = await pool.query(
        `
        SELECT
            t.id, t.title, t.status, t.priority, t.due_date,
            t.assigned_to, t.created_at,
            u.first_name AS assigned_to_first_name,
            u.last_name AS assigned_to_last_name,
            p.project_name
        FROM task_management.tasks t
        LEFT JOIN task_management.users u ON u.id = t.assigned_to
        LEFT JOIN task_management.projects p ON p.id = t.project_id
        WHERE ${listWhere}
        ORDER BY t.created_at DESC
        LIMIT 8
        `,
        listParams
    );

    const overdueTasks = await pool.query(
        `
        SELECT
            t.id, t.title, t.status, t.priority, t.due_date,
            u.first_name AS assigned_to_first_name,
            u.last_name AS assigned_to_last_name
        FROM task_management.tasks t
        LEFT JOIN task_management.users u ON u.id = t.assigned_to
        WHERE ${listWhere}
          AND t.due_date < CURRENT_DATE
          AND t.status NOT IN ('Completed', 'Cancelled')
        ORDER BY t.due_date ASC
        LIMIT 8
        `,
        listParams
    );

    const upcomingDeadlines = await pool.query(
        `
        SELECT
            t.id, t.title, t.status, t.priority, t.due_date,
            u.first_name AS assigned_to_first_name,
            u.last_name AS assigned_to_last_name
        FROM task_management.tasks t
        LEFT JOIN task_management.users u ON u.id = t.assigned_to
        WHERE ${listWhere}
          AND t.due_date >= CURRENT_DATE
          AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
          AND t.status NOT IN ('Completed', 'Cancelled')
        ORDER BY t.due_date ASC
        LIMIT 8
        `,
        listParams
    );

    const activityParams = [];
    const activityFilters = ["a.module_name IN ('task', 'project')"];

    if (companyId) {
        activityParams.push(companyId);
        activityFilters.push(`a.company_id = $${activityParams.length}`);
    }

    const recentActivity = await pool.query(
        `
        SELECT
            a.id, a.action, a.description, a.old_value, a.new_value,
            a.reference_id, a.created_at,
            u.first_name, u.last_name
        FROM task_management.activity_logs a
        LEFT JOIN task_management.users u ON u.id = a.user_id
        WHERE ${activityFilters.join(" AND ")}
        ORDER BY a.created_at DESC
        LIMIT 10
        `,
        activityParams
    );

    return {
        stats: {
            ...statsResult.rows[0],
            my_tasks: personalResult.rows[0].my_tasks,
            tasks_created: personalResult.rows[0].tasks_created,
            tasks_assigned: personalResult.rows[0].tasks_assigned,
        },
        status_chart: statusChart.rows,
        priority_chart: priorityChart.rows,
        recent_tasks: recentTasks.rows,
        overdue_tasks: overdueTasks.rows,
        upcoming_deadlines: upcomingDeadlines.rows,
        recent_activity: recentActivity.rows,
    };
};

const getReportsService = async (loggedInUser, query = {}) => {
    const companyId = isSystemAdmin(loggedInUser)
        ? query.company_id
            ? Number(query.company_id)
            : null
        : Number(loggedInUser.companyId);

    const params = [];
    let companyFilter = "";
    let userCompanyFilter = "";

    if (companyId) {
        params.push(companyId);
        companyFilter = `AND t.company_id = $1`;
        userCompanyFilter = `AND u.company_id = $1`;
    }

    const byUser = await pool.query(
        `
        SELECT
            u.id, u.first_name, u.last_name,
            COUNT(t.id)::int AS total,
            COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed,
            COUNT(t.id) FILTER (
                WHERE t.due_date < CURRENT_DATE
                AND t.status NOT IN ('Completed', 'Cancelled')
            )::int AS overdue
        FROM task_management.users u
        LEFT JOIN task_management.tasks t
            ON t.assigned_to = u.id AND t.is_active = TRUE ${companyFilter}
        WHERE u.deleted_at IS NULL
        ${userCompanyFilter}
        GROUP BY u.id
        ORDER BY total DESC
        LIMIT 50
        `,
        params
    );

    const byProject = await pool.query(
        `
        SELECT
            p.id, p.project_name, p.status AS project_status,
            COUNT(t.id)::int AS total_tasks,
            COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks
        FROM task_management.projects p
        LEFT JOIN task_management.tasks t
            ON t.project_id = p.id AND t.is_active = TRUE
        WHERE p.is_active = TRUE
        ${companyId ? "AND p.company_id = $1" : ""}
        GROUP BY p.id
        ORDER BY total_tasks DESC
        `,
        params
    );

    const byPriority = await pool.query(
        `
        SELECT priority, COUNT(*)::int AS count
        FROM task_management.tasks t
        WHERE t.is_active = TRUE
        ${companyFilter}
        GROUP BY priority
        `,
        params
    );

    const byStatus = await pool.query(
        `
        SELECT status, COUNT(*)::int AS count
        FROM task_management.tasks t
        WHERE t.is_active = TRUE
        ${companyFilter}
        GROUP BY status
        `,
        params
    );

    return {
        by_user: byUser.rows,
        by_project: byProject.rows,
        by_priority: byPriority.rows,
        by_status: byStatus.rows,
    };
};

module.exports = {
    getDashboardService,
    getReportsService,
};
