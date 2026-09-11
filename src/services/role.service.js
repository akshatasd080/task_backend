const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");

const ensureCompanyAccess = (user, companyId) => {
    if (isSystemAdmin(user)) return;
    if (Number(user.companyId) !== Number(companyId)) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }
};

const getPermissionsService = async () => {
    const result = await pool.query(
        `
        SELECT id, permission_name, module_name, description
        FROM task_management.permissions
        ORDER BY module_name, permission_name
        `
    );
    return result.rows;
};

const getRolesService = async (loggedInUser, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const requestedLimit = query.limit == null || query.limit === "" ? null : Number(query.limit);
    const paginate = requestedLimit != null || Boolean(query.page);
    const limit = paginate ? Math.min(100, Math.max(1, requestedLimit || 10)) : null;

    const params = [];
    const companyFilters = ["r.deleted_at IS NULL"];

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        companyFilters.push(`r.company_id = $${params.length}`);
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        companyFilters.push(`r.company_id = $${params.length}`);
    }

    const companyWhere = `WHERE ${companyFilters.join(" AND ")}`;

    const statsResult = await pool.query(
        `
        SELECT
            COUNT(*)::int AS total_roles,
            COALESCE(SUM(pc.permission_count), 0)::int AS total_permissions,
            MAX(r.updated_at) AS last_updated,
            (
                SELECT r2.role_name
                FROM task_management.roles r2
                LEFT JOIN LATERAL (
                    SELECT COUNT(*)::int AS permission_count
                    FROM task_management.role_permissions rp
                    WHERE rp.role_id = r2.id AND rp.is_active = TRUE
                ) x ON TRUE
                ${companyWhere.replaceAll("r.", "r2.")}
                ORDER BY x.permission_count DESC, r2.id ASC
                LIMIT 1
            ) AS most_privileged_role,
            (
                SELECT r2.description
                FROM task_management.roles r2
                LEFT JOIN LATERAL (
                    SELECT COUNT(*)::int AS permission_count
                    FROM task_management.role_permissions rp
                    WHERE rp.role_id = r2.id AND rp.is_active = TRUE
                ) x ON TRUE
                ${companyWhere.replaceAll("r.", "r2.")}
                ORDER BY x.permission_count DESC, r2.id ASC
                LIMIT 1
            ) AS most_privileged_description
        FROM task_management.roles r
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS permission_count
            FROM task_management.role_permissions rp
            WHERE rp.role_id = r.id AND rp.is_active = TRUE
        ) pc ON TRUE
        ${companyWhere}
        `,
        params
    );

    const filters = [...companyFilters];
    const listParams = [...params];

    if (query.search) {
        listParams.push(`%${String(query.search).trim()}%`);
        filters.push(`(
            r.role_name ILIKE $${listParams.length}
            OR COALESCE(r.description, '') ILIKE $${listParams.length}
        )`);
    }

    if (query.status === "active") {
        filters.push("r.is_active = TRUE");
    } else if (query.status === "inactive") {
        filters.push("r.is_active = FALSE");
    } else if (query.status === "system") {
        filters.push("r.is_system = TRUE");
    } else if (query.status === "custom") {
        filters.push("r.is_system = FALSE");
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    const countResult = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM task_management.roles r
        ${where}
        `,
        listParams
    );
    const total = countResult.rows[0]?.total || 0;

    let paging = "";
    const pageParams = [...listParams];
    if (limit != null) {
        pageParams.push(limit);
        pageParams.push((page - 1) * limit);
        paging = `LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`;
    }

    const result = await pool.query(
        `
        SELECT
            r.id, r.company_id, r.role_name, r.description,
            r.is_system, r.is_active, r.created_at, r.updated_at,
            COUNT(p.id) FILTER (WHERE p.id IS NOT NULL)::int AS permission_count,
            COALESCE(users.user_count, 0) AS user_count,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', p.id::text,
                        'permission_name', p.permission_name,
                        'module_name', p.module_name
                    )
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) AS permissions
        FROM task_management.roles r
        LEFT JOIN task_management.role_permissions rp
            ON rp.role_id = r.id AND rp.is_active = TRUE
        LEFT JOIN task_management.permissions p ON p.id = rp.permission_id
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS user_count
            FROM task_management.users u
            WHERE u.role_id = r.id AND u.deleted_at IS NULL
        ) users ON TRUE
        ${where}
        GROUP BY r.id, users.user_count
        ORDER BY r.id ASC
        ${paging}
        `,
        pageParams
    );

    const items = result.rows;
    const effectiveLimit = limit || Math.max(items.length, total, 1);
    const stats = statsResult.rows[0] || {};

    return {
        items,
        pagination: {
            page: limit == null ? 1 : page,
            limit: effectiveLimit,
            total,
            totalPages: limit == null ? 1 : Math.max(1, Math.ceil(total / effectiveLimit)),
        },
        stats: {
            total_roles: stats.total_roles || 0,
            total_permissions: stats.total_permissions || 0,
            most_privileged_role: stats.most_privileged_role || "—",
            most_privileged_description: stats.most_privileged_description || "",
            last_updated: stats.last_updated || null,
        },
    };
};

const getRoleByIdService = async (roleId, loggedInUser) => {
    const result = await pool.query(
        `
        SELECT
            r.id, r.company_id, r.role_name, r.description,
            r.is_system, r.is_active, r.created_at, r.updated_at,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', p.id::text,
                        'permission_name', p.permission_name,
                        'module_name', p.module_name
                    )
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) AS permissions
        FROM task_management.roles r
        LEFT JOIN task_management.role_permissions rp
            ON rp.role_id = r.id AND rp.is_active = TRUE
        LEFT JOIN task_management.permissions p ON p.id = rp.permission_id
        WHERE r.id = $1 AND r.deleted_at IS NULL
        GROUP BY r.id
        `,
        [roleId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Role not found."), { statusCode: 404 });
    }

    ensureCompanyAccess(loggedInUser, result.rows[0].company_id);
    return result.rows[0];
};

const createRoleService = async (data, loggedInUser) => {
    const companyId = isSystemAdmin(loggedInUser)
        ? Number(data.company_id)
        : Number(loggedInUser.companyId);

    if (!companyId) {
        throw Object.assign(new Error("Company is required."), { statusCode: 400 });
    }

    ensureCompanyAccess(loggedInUser, companyId);

    const { role_name, description, permission_ids = [], is_active } = data;
    const nextActive =
        is_active === undefined || is_active === null || is_active === ""
            ? true
            : is_active === true || String(is_active).toLowerCase() === "true";

    const result = await pool.query(
        `
        INSERT INTO task_management.roles
        (company_id, role_name, description, is_active, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING *
        `,
        [companyId, role_name, description || null, nextActive, loggedInUser.id]
    );

    const role = result.rows[0];

    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
        for (const permissionId of permission_ids) {
            await pool.query(
                `
                INSERT INTO task_management.role_permissions (role_id, permission_id, assigned_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (role_id, permission_id) DO UPDATE
                SET is_active = TRUE
                `,
                [role.id, permissionId, loggedInUser.id]
            );
        }
    }

    return getRoleByIdService(role.id, loggedInUser);
};

const updateRoleService = async (roleId, data, loggedInUser) => {
    const existing = await getRoleByIdService(roleId, loggedInUser);

    const { role_name, description, is_active, permission_ids } = data;

    await pool.query(
        `
        UPDATE task_management.roles
        SET
            role_name = COALESCE($1, role_name),
            description = COALESCE($2, description),
            is_active = COALESCE($3, is_active),
            updated_by = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        `,
        [
            role_name ?? null,
            description ?? null,
            typeof is_active === "boolean" ? is_active : null,
            loggedInUser.id,
            roleId,
        ]
    );

    if (Array.isArray(permission_ids)) {
        await pool.query(
            `DELETE FROM task_management.role_permissions WHERE role_id = $1`,
            [roleId]
        );

        for (const permissionId of permission_ids) {
            await pool.query(
                `
                INSERT INTO task_management.role_permissions (role_id, permission_id, assigned_by)
                VALUES ($1, $2, $3)
                `,
                [roleId, permissionId, loggedInUser.id]
            );
        }
    }

    return getRoleByIdService(existing.id, loggedInUser);
};

const deleteRoleService = async (roleId, loggedInUser) => {
    const role = await getRoleByIdService(roleId, loggedInUser);

    if (role.is_system) {
        throw Object.assign(new Error("System roles cannot be deleted."), { statusCode: 400 });
    }

    const usersUsingRole = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM task_management.users
        WHERE role_id = $1 AND deleted_at IS NULL
        `,
        [roleId]
    );

    if (usersUsingRole.rows[0].total > 0) {
        throw Object.assign(new Error("Role is assigned to users and cannot be deleted."), {
            statusCode: 400,
        });
    }

    const result = await pool.query(
        `
        UPDATE task_management.roles
        SET deleted_at = CURRENT_TIMESTAMP,
            is_active = FALSE,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, role_name, deleted_at
        `,
        [roleId, loggedInUser.id]
    );

    return result.rows[0];
};

module.exports = {
    getPermissionsService,
    getRolesService,
    getRoleByIdService,
    createRoleService,
    updateRoleService,
    deleteRoleService,
};
