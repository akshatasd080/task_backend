const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");
const { logActivity } = require("../utils/helpers");

const VALID_STATUSES = ["Planning", "Active", "On Hold", "Completed", "Cancelled"];

const ensureCompanyAccess = (user, companyId) => {
    if (isSystemAdmin(user)) return;
    if (Number(user.companyId) !== Number(companyId)) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }
};

const createProjectService = async (data, loggedInUser) => {
    const companyId = isSystemAdmin(loggedInUser)
        ? Number(data.company_id)
        : Number(loggedInUser.companyId);

    if (!companyId) {
        throw Object.assign(new Error("Company is required."), { statusCode: 400 });
    }

    ensureCompanyAccess(loggedInUser, companyId);

    const {
        project_name,
        project_code,
        description,
        start_date,
        end_date,
        status = "Planning",
        priority = "Medium",
        member_ids = [],
    } = data;

    if (!VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error("Invalid project status."), { statusCode: 400 });
    }

    const result = await pool.query(
        `
        INSERT INTO task_management.projects
        (
            company_id, project_name, project_code, description,
            start_date, end_date, status, priority, created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
        `,
        [
            companyId,
            project_name,
            project_code || null,
            description || null,
            start_date || null,
            end_date || null,
            status,
            priority,
            loggedInUser.id,
        ]
    );

    const project = result.rows[0];

    if (Array.isArray(member_ids)) {
        for (const memberId of member_ids) {
            await pool.query(
                `
                INSERT INTO task_management.project_members (project_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (project_id, user_id) DO NOTHING
                `,
                [project.id, memberId]
            );
        }
    }

    await logActivity({
        companyId,
        userId: loggedInUser.id,
        moduleName: "project",
        action: "created",
        referenceId: project.id,
        description: `Project "${project.project_name}" created`,
        newValue: project.project_name,
    });

    return getProjectByIdService(project.id, loggedInUser);
};

const getProjectsService = async (loggedInUser, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    const params = [];
    const filters = ["p.is_active = TRUE"];

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        filters.push(`p.company_id = $${params.length}`);
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        filters.push(`p.company_id = $${params.length}`);
    }

    if (query.status) {
        params.push(query.status);
        filters.push(`p.status = $${params.length}`);
    }

    if (query.search) {
        params.push(`%${query.search}%`);
        filters.push(`(p.project_name ILIKE $${params.length} OR p.project_code ILIKE $${params.length})`);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM task_management.projects p ${where}`,
        params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
        `
        SELECT
            p.*,
            u.first_name AS created_by_first_name,
            u.last_name AS created_by_last_name,
            (
                SELECT COUNT(*)::int FROM task_management.tasks t
                WHERE t.project_id = p.id AND t.is_active = TRUE
            ) AS task_count
        FROM task_management.projects p
        LEFT JOIN task_management.users u ON u.id = p.created_by
        ${where}
        ORDER BY p.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
        `,
        params
    );

    return {
        items: result.rows,
        pagination: {
            page,
            limit,
            total: countResult.rows[0].total,
            totalPages: Math.ceil(countResult.rows[0].total / limit) || 1,
        },
    };
};

const getProjectByIdService = async (projectId, loggedInUser) => {
    const result = await pool.query(
        `
        SELECT
            p.*,
            u.first_name AS created_by_first_name,
            u.last_name AS created_by_last_name
        FROM task_management.projects p
        LEFT JOIN task_management.users u ON u.id = p.created_by
        WHERE p.id = $1 AND p.is_active = TRUE
        `,
        [projectId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Project not found."), { statusCode: 404 });
    }

    ensureCompanyAccess(loggedInUser, result.rows[0].company_id);

    const members = await pool.query(
        `
        SELECT
            pm.id, pm.user_id, pm.joined_at,
            u.first_name, u.last_name, u.email
        FROM task_management.project_members pm
        INNER JOIN task_management.users u ON u.id = pm.user_id
        WHERE pm.project_id = $1
        `,
        [projectId]
    );

    return {
        ...result.rows[0],
        members: members.rows,
    };
};

const updateProjectService = async (projectId, data, loggedInUser) => {
    const existing = await getProjectByIdService(projectId, loggedInUser);

    const {
        project_name,
        project_code,
        description,
        start_date,
        end_date,
        status,
        priority,
        member_ids,
    } = data;

    if (status && !VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error("Invalid project status."), { statusCode: 400 });
    }

    const result = await pool.query(
        `
        UPDATE task_management.projects
        SET
            project_name = COALESCE($1, project_name),
            project_code = COALESCE($2, project_code),
            description = COALESCE($3, description),
            start_date = COALESCE($4, start_date),
            end_date = COALESCE($5, end_date),
            status = COALESCE($6, status),
            priority = COALESCE($7, priority),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
        `,
        [
            project_name ?? null,
            project_code ?? null,
            description ?? null,
            start_date ?? null,
            end_date ?? null,
            status ?? null,
            priority ?? null,
            projectId,
        ]
    );

    if (Array.isArray(member_ids)) {
        await pool.query(`DELETE FROM task_management.project_members WHERE project_id = $1`, [
            projectId,
        ]);
        for (const memberId of member_ids) {
            await pool.query(
                `
                INSERT INTO task_management.project_members (project_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                `,
                [projectId, memberId]
            );
        }
    }

    await logActivity({
        companyId: existing.company_id,
        userId: loggedInUser.id,
        moduleName: "project",
        action: "updated",
        referenceId: projectId,
        description: `Project updated`,
        oldValue: existing.project_name,
        newValue: result.rows[0].project_name,
    });

    return getProjectByIdService(projectId, loggedInUser);
};

const deleteProjectService = async (projectId, loggedInUser) => {
    const existing = await getProjectByIdService(projectId, loggedInUser);

    const result = await pool.query(
        `
        UPDATE task_management.projects
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, project_name, is_active
        `,
        [projectId]
    );

    await logActivity({
        companyId: existing.company_id,
        userId: loggedInUser.id,
        moduleName: "project",
        action: "deleted",
        referenceId: projectId,
        description: `Project "${existing.project_name}" deleted`,
    });

    return result.rows[0];
};

module.exports = {
    createProjectService,
    getProjectsService,
    getProjectByIdService,
    updateProjectService,
    deleteProjectService,
};
