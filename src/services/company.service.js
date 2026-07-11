const pool = require("../config/db");


/**
 * ==========================================================
 * Create Company Service
 * ==========================================================
 */
const createCompanyService = async (
    companyData,
    loggedInUserId
) => {

    const {
        company_name,
        company_code,
        email,
        phone,
        address,
        logo_url,
    } = companyData;

    // ======================================================
    // Check Company Code
    // ======================================================

    const companyCodeResult = await pool.query(
        `
        SELECT id
        FROM task_management.companies
        WHERE company_code = $1
        AND deleted_at IS NULL
        `,
        [company_code]
    );

    if (companyCodeResult.rows.length > 0) {
        throw new Error("Company code already exists.");
    }

    // ======================================================
    // Check Company Email
    // ======================================================

    const companyEmailResult = await pool.query(
        `
        SELECT id
        FROM task_management.companies
        WHERE email = $1
        AND deleted_at IS NULL
        `,
        [email]
    );

    if (companyEmailResult.rows.length > 0) {
        throw new Error("Company email already exists.");
    }

    // ======================================================
    // Create Company
    // ======================================================

    const result = await pool.query(
        `
        INSERT INTO task_management.companies
        (
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
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
            $6,
            $7,
            $8
        )
        RETURNING
            id,
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            company_name,
            company_code,
            email,
            phone || null,
            address || null,
            logo_url || null,
            loggedInUserId,
            loggedInUserId,
        ]
    );

    return result.rows[0];

};


/**
 * ==========================================================
 * Get All Companies Service
 * ==========================================================
 */
const getAllCompaniesService = async () => {

    const result = await pool.query(
        `
        SELECT
            id,
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM task_management.companies
        WHERE deleted_at IS NULL
        ORDER BY id ASC
        `
    );

    return result.rows;

};


/**
 * ==========================================================
 * Get Company By ID Service
 * ==========================================================
 */
const getCompanyByIdService = async (companyId) => {

    const result = await pool.query(
        `
        SELECT
            id,
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        FROM task_management.companies
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [companyId]
    );

    if (result.rows.length === 0) {
        throw new Error("Company not found.");
    }

    return result.rows[0];

};


/**
 * ==========================================================
 * Update Company Service
 * ==========================================================
 */
const updateCompanyService = async (
    companyId,
    companyData,
    loggedInUserId
) => {

    const {
        company_name,
        company_code,
        email,
        phone,
        address,
        logo_url,
    } = companyData;

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
        [companyId]
    );

    if (companyResult.rows.length === 0) {
        throw new Error("Company not found.");
    }

    // ======================================================
    // Check Duplicate Company Code
    // ======================================================

    const companyCodeResult = await pool.query(
        `
        SELECT id
        FROM task_management.companies
        WHERE company_code = $1
        AND id <> $2
        AND deleted_at IS NULL
        `,
        [
            company_code,
            companyId,
        ]
    );

    if (companyCodeResult.rows.length > 0) {
        throw new Error("Company code already exists.");
    }

    // ======================================================
    // Check Duplicate Email
    // ======================================================

    const companyEmailResult = await pool.query(
        `
        SELECT id
        FROM task_management.companies
        WHERE email = $1
        AND id <> $2
        AND deleted_at IS NULL
        `,
        [
            email,
            companyId,
        ]
    );

    if (companyEmailResult.rows.length > 0) {
        throw new Error("Company email already exists.");
    }

    // ======================================================
    // Update Company
    // ======================================================

    const result = await pool.query(
        `
        UPDATE task_management.companies
        SET
            company_name = $1,
            company_code = $2,
            email = $3,
            phone = $4,
            address = $5,
            logo_url = $6,
            updated_by = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING
            id,
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            company_name,
            company_code,
            email,
            phone || null,
            address || null,
            logo_url || null,
            loggedInUserId,
            companyId,
        ]
    );

    return result.rows[0];

};


/**
 * ==========================================================
 * Update Company Status Service
 * ==========================================================
 */
const updateCompanyStatusService = async (
    companyId,
    isActive,
    loggedInUserId
) => {

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
        [companyId]
    );

    if (companyResult.rows.length === 0) {
        throw new Error("Company not found.");
    }

    // ======================================================
    // Update Status
    // ======================================================

    const result = await pool.query(
        `
        UPDATE task_management.companies
        SET
            is_active = $1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3

        RETURNING
            id,
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            isActive,
            loggedInUserId,
            companyId
        ]
    );

    return result.rows[0];

};


/**
 * ==========================================================
 * Delete Company Service (Soft Delete)
 * ==========================================================
 */
const deleteCompanyService = async (
    companyId,
    loggedInUserId
) => {

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
        [companyId]
    );

    if (companyResult.rows.length === 0) {
        throw new Error("Company not found.");
    }

    // ======================================================
    // Soft Delete Company
    // ======================================================

    const result = await pool.query(
        `
        UPDATE task_management.companies
        SET
            deleted_at = CURRENT_TIMESTAMP,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1

        RETURNING
            id,
            company_name,
            company_code,
            email,
            phone,
            address,
            logo_url,
            is_active,
            deleted_at,
            created_by,
            updated_by,
            created_at,
            updated_at
        `,
        [
            companyId,
            loggedInUserId
        ]
    );

    return result.rows[0];

};


module.exports = {
    createCompanyService,
    getAllCompaniesService,
    getCompanyByIdService,
    updateCompanyService,
    updateCompanyStatusService,
    deleteCompanyService,
};