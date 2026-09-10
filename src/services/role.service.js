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
    const params = [];
    let companyFilter = "";

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        companyFilter = `AND r.company_id = $${params.length}`;
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        companyFilter = `AND r.company_id = $${params.length}`;
    }

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
        WHERE r.deleted_at IS NULL
        ${companyFilter}
        GROUP BY r.id
        ORDER BY r.id ASC
        `,
        params
    );

    return result.rows;
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

    const { role_name, description, permission_ids = [] } = data;

    const result = await pool.query(
        `
        INSERT INTO task_management.roles
        (company_id, role_name, description, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $4)
        RETURNING *
        `,
        [companyId, role_name, description || null, loggedInUser.id]
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
