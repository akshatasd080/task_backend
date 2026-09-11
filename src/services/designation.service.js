const pool = require("../config/db");
const { isSystemAdmin } = require("../utils/tenant");

const resolveCompanyId = (loggedInUser, data = {}) => {
    if (isSystemAdmin(loggedInUser)) {
        const companyId = Number(data.company_id);
        if (!companyId) {
            throw Object.assign(new Error("Company is required."), { statusCode: 400 });
        }
        return companyId;
    }
    return Number(loggedInUser.companyId);
};

const ensureCompanyAccess = (user, companyId) => {
    if (isSystemAdmin(user)) return;
    if (Number(user.companyId) !== Number(companyId)) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }
};

const getDesignationsService = async (loggedInUser, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const requestedLimit = query.limit == null || query.limit === "" ? null : Number(query.limit);
    const paginate = requestedLimit != null || Boolean(query.page);
    const limit = paginate ? Math.min(100, Math.max(1, requestedLimit || 10)) : null;

    const params = [];
    const filters = ["d.deleted_at IS NULL"];

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        filters.push(`d.company_id = $${params.length}`);
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        filters.push(`d.company_id = $${params.length}`);
    }

    if (query.search) {
        params.push(`%${String(query.search).trim()}%`);
        filters.push(`(
            d.designation_name ILIKE $${params.length}
            OR COALESCE(d.description, '') ILIKE $${params.length}
        )`);
    }

    if (query.status === "active") {
        filters.push("d.is_active = TRUE");
    } else if (query.status === "inactive") {
        filters.push("d.is_active = FALSE");
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    const countResult = await pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM task_management.designations d
        ${where}
        `,
        params
    );
    const total = countResult.rows[0]?.total || 0;

    const listParams = [...params];
    let paging = "";
    if (limit != null) {
        listParams.push(limit);
        listParams.push((page - 1) * limit);
        paging = `LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`;
    }

    const result = await pool.query(
        `
        SELECT
            d.id,
            d.company_id,
            d.designation_name,
            d.description,
            d.is_active,
            d.created_at,
            d.updated_at,
            COALESCE(users.user_count, 0) AS user_count
        FROM task_management.designations d
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS user_count
            FROM task_management.users u
            WHERE u.deleted_at IS NULL
              AND u.company_id = d.company_id
              AND lower(COALESCE(u.designation, '')) = lower(d.designation_name)
        ) users ON TRUE
        ${where}
        ORDER BY d.designation_name ASC
        ${paging}
        `,
        listParams
    );

    const items = result.rows;
    const effectiveLimit = limit || Math.max(items.length, total, 1);

    return {
        items,
        pagination: {
            page: limit == null ? 1 : page,
            limit: effectiveLimit,
            total,
            totalPages: limit == null ? 1 : Math.max(1, Math.ceil(total / effectiveLimit)),
        },
    };
};

const getDesignationByIdService = async (id, loggedInUser) => {
    const result = await pool.query(
        `
        SELECT
            d.id,
            d.company_id,
            d.designation_name,
            d.description,
            d.is_active,
            d.created_at,
            d.updated_at,
            COALESCE(users.user_count, 0) AS user_count
        FROM task_management.designations d
        LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS user_count
            FROM task_management.users u
            WHERE u.deleted_at IS NULL
              AND u.company_id = d.company_id
              AND lower(COALESCE(u.designation, '')) = lower(d.designation_name)
        ) users ON TRUE
        WHERE d.id = $1 AND d.deleted_at IS NULL
        `,
        [id]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Designation not found."), { statusCode: 404 });
    }

    ensureCompanyAccess(loggedInUser, result.rows[0].company_id);
    return result.rows[0];
};

const createDesignationService = async (data, loggedInUser) => {
    const companyId = resolveCompanyId(loggedInUser, data);
    ensureCompanyAccess(loggedInUser, companyId);

    const designationName = String(data.designation_name || "").trim();
    if (designationName.length < 2) {
        throw Object.assign(new Error("Designation name must be at least 2 characters."), {
            statusCode: 400,
        });
    }

    const existing = await pool.query(
        `
        SELECT id
        FROM task_management.designations
        WHERE company_id = $1
          AND lower(designation_name) = lower($2)
          AND deleted_at IS NULL
        `,
        [companyId, designationName]
    );

    if (existing.rows.length > 0) {
        throw Object.assign(new Error("Designation already exists."), { statusCode: 400 });
    }

    const isActive =
        data.is_active === undefined || data.is_active === null || data.is_active === ""
            ? true
            : data.is_active === true || String(data.is_active).toLowerCase() === "true";

    const result = await pool.query(
        `
        INSERT INTO task_management.designations
        (company_id, designation_name, description, is_active, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING
            id, company_id, designation_name, description,
            is_active, created_at, updated_at
        `,
        [companyId, designationName, data.description || null, isActive, loggedInUser.id]
    );

    return result.rows[0];
};

const updateDesignationService = async (id, data, loggedInUser) => {
    const existing = await getDesignationByIdService(id, loggedInUser);
    const designationName = String(data.designation_name || existing.designation_name).trim();

    if (designationName.length < 2) {
        throw Object.assign(new Error("Designation name must be at least 2 characters."), {
            statusCode: 400,
        });
    }

    const duplicate = await pool.query(
        `
        SELECT id
        FROM task_management.designations
        WHERE company_id = $1
          AND lower(designation_name) = lower($2)
          AND id <> $3
          AND deleted_at IS NULL
        `,
        [existing.company_id, designationName, id]
    );

    if (duplicate.rows.length > 0) {
        throw Object.assign(new Error("Designation already exists."), { statusCode: 400 });
    }

    const nextActive =
        data.is_active === undefined || data.is_active === null || data.is_active === ""
            ? existing.is_active
            : data.is_active === true || String(data.is_active).toLowerCase() === "true";
    const nextDescription =
        data.description === undefined ? existing.description : String(data.description || "").trim() || null;

    const result = await pool.query(
        `
        UPDATE task_management.designations
        SET
            designation_name = $1,
            description = $2,
            is_active = $3,
            updated_by = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING
            id, company_id, designation_name, description,
            is_active, created_at, updated_at
        `,
        [
            designationName,
            nextDescription,
            nextActive,
            loggedInUser.id,
            id,
        ]
    );

    return result.rows[0];
};

const deleteDesignationService = async (id, loggedInUser) => {
    await getDesignationByIdService(id, loggedInUser);

    const result = await pool.query(
        `
        UPDATE task_management.designations
        SET
            deleted_at = CURRENT_TIMESTAMP,
            is_active = FALSE,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, designation_name, deleted_at
        `,
        [id, loggedInUser.id]
    );

    return result.rows[0];
};

module.exports = {
    getDesignationsService,
    getDesignationByIdService,
    createDesignationService,
    updateDesignationService,
    deleteDesignationService,
};
