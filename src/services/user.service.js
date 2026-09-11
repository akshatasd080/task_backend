const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");
const { attachWorkflow } = require("../utils/taskWorkflow");

const ensureCompanyAccess = (user, companyId) => {
    if (isSystemAdmin(user)) return;
    if (Number(user.companyId) !== Number(companyId)) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }
};

const assertValidManager = async (companyId, managerId, excludeUserId = null) => {
    if (managerId == null || managerId === "") return null;

    const id = Number(managerId);
    if (!id) {
        throw Object.assign(new Error("Selected manager is invalid."), { statusCode: 400 });
    }

    if (excludeUserId && Number(excludeUserId) === id) {
        throw Object.assign(new Error("A user cannot be their own manager."), { statusCode: 400 });
    }

    const result = await pool.query(
        `
        SELECT id FROM task_management.users
        WHERE id = $1
          AND company_id = $2
          AND deleted_at IS NULL
          AND is_active = TRUE
        `,
        [id, companyId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Selected manager must be an active user in this company."), {
            statusCode: 400,
        });
    }

    return id;
};

const createUserService = async (data, loggedInUser) => {
    const companyId = isSystemAdmin(loggedInUser)
        ? Number(data.company_id)
        : Number(loggedInUser.companyId);

    if (!companyId) {
        throw Object.assign(new Error("Company is required."), { statusCode: 400 });
    }

    ensureCompanyAccess(loggedInUser, companyId);

    const {
        first_name,
        last_name,
        email,
        phone,
        password,
        role_id,
        department_id,
        manager_id,
        employee_code,
        designation,
    } = data;

    const roleCheck = await pool.query(
        `
        SELECT id FROM task_management.roles
        WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
        `,
        [role_id, companyId]
    );

    if (roleCheck.rows.length === 0) {
        throw Object.assign(new Error("Invalid role for this company."), { statusCode: 400 });
    }

    const emailCheck = await pool.query(
        `
        SELECT id FROM task_management.users
        WHERE company_id = $1 AND email = $2 AND deleted_at IS NULL
        `,
        [companyId, email]
    );

    if (emailCheck.rows.length > 0) {
        throw Object.assign(new Error("Email already exists in this company."), { statusCode: 400 });
    }

    const validManagerId = await assertValidManager(companyId, manager_id);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `
        INSERT INTO task_management.users
        (
            company_id, role_id, department_id, manager_id,
            first_name, last_name, email, phone, password,
            employee_code, designation, created_by, updated_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
        RETURNING
            id, company_id, role_id, department_id, manager_id,
            first_name, last_name, email, phone, employee_code,
            designation, is_active, created_at, updated_at
        `,
        [
            companyId,
            role_id,
            department_id || null,
            validManagerId,
            first_name,
            last_name || null,
            email,
            phone || null,
            hashedPassword,
            employee_code || null,
            designation || null,
            loggedInUser.id,
        ]
    );

    return result.rows[0];
};

const getUsersService = async (loggedInUser, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = query.search ? `%${query.search}%` : null;

    let companyFilter = "";
    const params = [];

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        companyFilter = `AND u.company_id = $${params.length}`;
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        companyFilter = `AND u.company_id = $${params.length}`;
    }

    let searchFilter = "";
    if (search) {
        params.push(search);
        searchFilter = `AND (
            u.first_name ILIKE $${params.length}
            OR u.last_name ILIKE $${params.length}
            OR u.email ILIKE $${params.length}
        )`;
    }

    const countResult = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM task_management.users u
        WHERE u.deleted_at IS NULL
        ${companyFilter}
        ${searchFilter}
        `,
        params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
        `
        SELECT
            u.id, u.company_id, u.role_id, u.department_id, u.manager_id,
            u.first_name, u.last_name, u.email, u.phone,
            u.employee_code, u.designation, u.is_active,
            u.last_login, u.created_at, u.updated_at,
            r.role_name,
            d.department_name,
            m.first_name AS manager_first_name,
            m.last_name AS manager_last_name,
            m.email AS manager_email
        FROM task_management.users u
        LEFT JOIN task_management.roles r ON r.id = u.role_id
        LEFT JOIN task_management.departments d ON d.id = u.department_id
        LEFT JOIN task_management.users m ON m.id = u.manager_id
        WHERE u.deleted_at IS NULL
        ${companyFilter}
        ${searchFilter}
        ORDER BY u.id DESC
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

const getUserByIdService = async (userId, loggedInUser) => {
    const result = await pool.query(
        `
        SELECT
            u.id, u.company_id, u.role_id, u.department_id, u.manager_id,
            u.first_name, u.last_name, u.email, u.phone,
            u.employee_code, u.designation, u.profile_image, u.is_active,
            u.last_login, u.created_at, u.updated_at,
            r.role_name,
            d.department_name,
            m.first_name AS manager_first_name,
            m.last_name AS manager_last_name,
            m.email AS manager_email
        FROM task_management.users u
        LEFT JOIN task_management.roles r ON r.id = u.role_id
        LEFT JOIN task_management.departments d ON d.id = u.department_id
        LEFT JOIN task_management.users m ON m.id = u.manager_id
        WHERE u.id = $1 AND u.deleted_at IS NULL
        `,
        [userId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("User not found."), { statusCode: 404 });
    }

    ensureCompanyAccess(loggedInUser, result.rows[0].company_id);
    return result.rows[0];
};

const updateUserService = async (userId, data, loggedInUser) => {
    const existing = await getUserByIdService(userId, loggedInUser);

    const {
        first_name,
        last_name,
        phone,
        role_id,
        department_id,
        manager_id,
        employee_code,
        designation,
        is_active,
    } = data;

    if (role_id) {
        const roleCheck = await pool.query(
            `
            SELECT id FROM task_management.roles
            WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
            `,
            [role_id, existing.company_id]
        );
        if (roleCheck.rows.length === 0) {
            throw Object.assign(new Error("Invalid role for this company."), { statusCode: 400 });
        }
    }

    const nextManagerId = Object.prototype.hasOwnProperty.call(data, "manager_id")
        ? await assertValidManager(existing.company_id, manager_id, userId)
        : existing.manager_id;

    const result = await pool.query(
        `
        UPDATE task_management.users
        SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            role_id = COALESCE($4, role_id),
            department_id = COALESCE($5, department_id),
            manager_id = $6,
            employee_code = COALESCE($7, employee_code),
            designation = COALESCE($8, designation),
            is_active = COALESCE($9, is_active),
            updated_by = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING
            id, company_id, role_id, department_id, manager_id,
            first_name, last_name, email, phone, employee_code,
            designation, is_active, created_at, updated_at
        `,
        [
            first_name ?? null,
            last_name ?? null,
            phone ?? null,
            role_id ?? null,
            department_id ?? null,
            nextManagerId,
            employee_code ?? null,
            designation ?? null,
            typeof is_active === "boolean" ? is_active : null,
            loggedInUser.id,
            userId,
        ]
    );

    return result.rows[0];
};

const getMyTeamService = async (loggedInUser) => {
    if (isSystemAdmin(loggedInUser)) {
        return { members: [], tasks: [] };
    }

    const companyId = Number(loggedInUser.companyId);
    const managerId = Number(loggedInUser.id);

    const membersResult = await pool.query(
        `
        SELECT
            u.id, u.company_id, u.role_id, u.manager_id,
            u.first_name, u.last_name, u.email, u.phone,
            u.employee_code, u.designation, u.is_active,
            u.last_login, u.created_at, u.updated_at,
            r.role_name,
            COUNT(t.id)::int AS total_tasks,
            COUNT(t.id) FILTER (
                WHERE t.status NOT IN ('Completed', 'Cancelled')
            )::int AS open_tasks,
            COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks,
            COUNT(t.id) FILTER (
                WHERE t.due_date < CURRENT_DATE
                AND t.status NOT IN ('Completed', 'Cancelled')
            )::int AS overdue_tasks
        FROM task_management.users u
        LEFT JOIN task_management.roles r ON r.id = u.role_id
        LEFT JOIN task_management.tasks t
            ON t.assigned_to = u.id AND t.is_active = TRUE
        WHERE u.manager_id = $1
          AND u.company_id = $2
          AND u.deleted_at IS NULL
        GROUP BY u.id, r.role_name
        ORDER BY u.first_name ASC, u.last_name ASC
        `,
        [managerId, companyId]
    );

    const tasksResult = await pool.query(
        `
        SELECT
            t.id, t.title, t.status, t.priority, t.due_date,
            t.assigned_to, t.project_id, t.updated_at, t.created_at,
            p.project_name,
            u.first_name AS assigned_to_first_name,
            u.last_name AS assigned_to_last_name
        FROM task_management.tasks t
        INNER JOIN task_management.users u ON u.id = t.assigned_to
        LEFT JOIN task_management.projects p ON p.id = t.project_id
        WHERE u.manager_id = $1
          AND u.company_id = $2
          AND u.deleted_at IS NULL
          AND t.is_active = TRUE
        ORDER BY
            CASE WHEN t.status IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END,
            t.due_date ASC NULLS LAST,
            t.updated_at DESC
        `,
        [managerId, companyId]
    );

    return {
        members: membersResult.rows,
        tasks: tasksResult.rows.map((row) => attachWorkflow(row, loggedInUser)),
    };
};

const deleteUserService = async (userId, loggedInUser) => {
    await getUserByIdService(userId, loggedInUser);

    if (Number(userId) === Number(loggedInUser.id)) {
        throw Object.assign(new Error("You cannot delete your own account."), { statusCode: 400 });
    }

    const result = await pool.query(
        `
        UPDATE task_management.users
        SET deleted_at = CURRENT_TIMESTAMP,
            is_active = FALSE,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, email, deleted_at
        `,
        [userId, loggedInUser.id]
    );

    return result.rows[0];
};

module.exports = {
    createUserService,
    getUsersService,
    getUserByIdService,
    updateUserService,
    deleteUserService,
    getMyTeamService,
};
