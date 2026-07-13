const pool = require("../config/db");


/**
 * ==========================================================
 * Create Department Service
 * ==========================================================
 */
const createDepartmentService = async (
    departmentData,
    loggedInUserId
) => {

    const {
        company_id,
        department_name,
        department_code,
        description,
    } = departmentData;

    // ======================================================
    // Check Company Exists
    // ======================================================

    const companyResult = await pool.query(
        `
        SELECT id
        FROM task_management.companies
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [company_id]
    );

    if (companyResult.rows.length === 0) {
        throw new Error("Company not found.");
    }

    // ======================================================
    // Check Department Name
    // ======================================================

    const departmentNameResult = await pool.query(
        `
        SELECT id
        FROM task_management.departments
        WHERE company_id = $1
        AND department_name = $2
        AND deleted_at IS NULL
        `,
        [
            company_id,
            department_name,
        ]
    );

    if (departmentNameResult.rows.length > 0) {
        throw new Error("Department name already exists.");
    }

    // ======================================================
    // Check Department Code
    // ======================================================

    if (department_code) {

        const departmentCodeResult = await pool.query(
            `
            SELECT id
            FROM task_management.departments
            WHERE company_id = $1
            AND department_code = $2
            AND deleted_at IS NULL
            `,
            [
                company_id,
                department_code,
            ]
        );

        if (departmentCodeResult.rows.length > 0) {
            throw new Error("Department code already exists.");
        }

    }

    // ======================================================
    // Create Department
    // ======================================================

    const result = await pool.query(
        `
        INSERT INTO task_management.departments
        (
            company_id,
            department_name,
            department_code,
            description,
            created_by,
            updated_by
        )
        VALUES
        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )

        RETURNING
            id,
            company_id,
            department_name,
            department_code,
            description,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            company_id,
            department_name,
            department_code || null,
            description || null,
            loggedInUserId,
            loggedInUserId,
        ]
    );

    return result.rows[0];

};


/**
 * ==========================================================
 * Get All Departments Service
 * ==========================================================
 */
const getAllDepartmentsService = async (queryParams) => {

    const {
        page = 1,
        limit = 10,
        search = "",
        company_id,
        is_active,
        sort_by = "id",
        sort_order = "ASC",
    } = queryParams;

    const offset = (Number(page) - 1) * Number(limit);

    const result = await pool.query(
        `
        SELECT
            id,
            company_id,
            department_name,
            department_code,
            description,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM task_management.departments
        WHERE deleted_at IS NULL
       ORDER BY id ASC
       LIMIT $1
       OFFSET $2
        `
    );

    return result.rows;

};


/**
 * ==========================================================
 * Get Department By ID Service
 * ==========================================================
 */
const getDepartmentByIdService = async (departmentId) => {

    const result = await pool.query(
        `
        SELECT
            id,
            company_id,
            department_name,
            department_code,
            description,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM task_management.departments
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [departmentId]
    );

    if (result.rows.length === 0) {
        throw new Error("Department not found.");
    }

    return result.rows[0];

};


/**
 * ==========================================================
 * Update Department Service
 * ==========================================================
 */
const updateDepartmentService = async (
    departmentId,
    departmentData,
    loggedInUserId
) => {

    const {
        company_id,
        department_name,
        department_code,
        description,
    } = departmentData;

    // ======================================================
    // Check Department Exists
    // ======================================================

    const departmentResult = await pool.query(
        `
        SELECT id
        FROM task_management.departments
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [departmentId]
    );

    if (departmentResult.rows.length === 0) {
        throw new Error("Department not found.");
    }

    // ======================================================
    // Check Company Exists
    // ======================================================

    const companyResult = await pool.query(
        `
        SELECT id
        FROM task_management.companies
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [company_id]
    );

    if (companyResult.rows.length === 0) {
        throw new Error("Company not found.");
    }

    // ======================================================
    // Check Duplicate Department Name
    // ======================================================

    const departmentNameResult = await pool.query(
        `
        SELECT id
        FROM task_management.departments
        WHERE company_id = $1
        AND department_name = $2
        AND id <> $3
        AND deleted_at IS NULL
        `,
        [
            company_id,
            department_name,
            departmentId,
        ]
    );

    if (departmentNameResult.rows.length > 0) {
        throw new Error("Department name already exists.");
    }

    // ======================================================
    // Check Duplicate Department Code
    // ======================================================

    if (department_code) {

        const departmentCodeResult = await pool.query(
            `
            SELECT id
            FROM task_management.departments
            WHERE company_id = $1
            AND department_code = $2
            AND id <> $3
            AND deleted_at IS NULL
            `,
            [
                company_id,
                department_code,
                departmentId,
            ]
        );

        if (departmentCodeResult.rows.length > 0) {
            throw new Error("Department code already exists.");
        }

    }

    // ======================================================
    // Update Department
    // ======================================================

    const result = await pool.query(
        `
        UPDATE task_management.departments
        SET
            company_id = $1,
            department_name = $2,
            department_code = $3,
            description = $4,
            updated_by = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6

        RETURNING
            id,
            company_id,
            department_name,
            department_code,
            description,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            company_id,
            department_name,
            department_code || null,
            description || null,
            loggedInUserId,
            departmentId,
        ]
    );

    return result.rows[0];

};


/**
 * ==========================================================
 * Update Department Status Service
 * ==========================================================
 */
const updateDepartmentStatusService = async (
    departmentId,
    isActive,
    loggedInUserId
) => {

    // ======================================================
    // Check Department Exists
    // ======================================================

    const departmentResult = await pool.query(
        `
        SELECT id
        FROM task_management.departments
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [departmentId]
    );

    if (departmentResult.rows.length === 0) {
        throw new Error("Department not found.");
    }

    // ======================================================
    // Update Status
    // ======================================================

    const result = await pool.query(
        `
        UPDATE task_management.departments
        SET
            is_active = $1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3

        RETURNING
            id,
            company_id,
            department_name,
            department_code,
            description,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            isActive,
            loggedInUserId,
            departmentId,
        ]
    );

    return result.rows[0];

};


/**
 * ==========================================================
 * Delete Department Service (Soft Delete)
 * ==========================================================
 */
const deleteDepartmentService = async (
    departmentId,
    loggedInUserId
) => {

    // ======================================================
    // Check Department Exists
    // ======================================================

    const departmentResult = await pool.query(
        `
        SELECT id
        FROM task_management.departments
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [departmentId]
    );

    if (departmentResult.rows.length === 0) {
        throw new Error("Department not found.");
    }

    // ======================================================
    // Soft Delete Department
    // ======================================================

    const result = await pool.query(
        `
        UPDATE task_management.departments
        SET
            deleted_at = CURRENT_TIMESTAMP,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1

        RETURNING
            id,
            company_id,
            department_name,
            department_code,
            description,
            is_active,
            deleted_at,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            departmentId,
            loggedInUserId,
        ]
    );

    return result.rows[0];

};


module.exports = {
    createDepartmentService,
    getAllDepartmentsService,
    getDepartmentByIdService,
    updateDepartmentService,
    updateDepartmentStatusService,
    deleteDepartmentService,
};