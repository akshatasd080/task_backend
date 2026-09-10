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
    const params = [];
    let companyFilter = "";

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        companyFilter = `AND company_id = $${params.length}`;
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        companyFilter = `AND company_id = $${params.length}`;
    }

    const result = await pool.query(
        `
        SELECT
            id, company_id, designation_name, description,
            is_active, created_at, updated_at
        FROM task_management.designations
        WHERE deleted_at IS NULL
        ${companyFilter}
        ORDER BY designation_name ASC
        `,
        params
    );

    return result.rows;
};

const getDesignationByIdService = async (id, loggedInUser) => {
    const result = await pool.query(
        `
        SELECT
            id, company_id, designation_name, description,
            is_active, created_at, updated_at
        FROM task_management.designations
        WHERE id = $1 AND deleted_at IS NULL
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

    const result = await pool.query(
        `
        INSERT INTO task_management.designations
        (company_id, designation_name, description, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $4)
        RETURNING
            id, company_id, designation_name, description,
            is_active, created_at, updated_at
        `,
        [companyId, designationName, data.description || null, loggedInUser.id]
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

    const result = await pool.query(
        `
        UPDATE task_management.designations
        SET
            designation_name = $1,
            description = COALESCE($2, description),
            is_active = COALESCE($3, is_active),
            updated_by = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING
            id, company_id, designation_name, description,
            is_active, created_at, updated_at
        `,
        [
            designationName,
            data.description ?? null,
            typeof data.is_active === "boolean" ? data.is_active : null,
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
