const pool = require("../config/db");
const { onboardCompanyDefaults } = require("../utils/companyOnboard");


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
        admin_email,
        admin_password,
        admin_first_name,
        admin_last_name,
    } = companyData;

    if (!admin_email || !admin_password) {
        throw Object.assign(
            new Error("Company admin email and password are required."),
            { statusCode: 400 }
        );
    }

    if (String(admin_password).length < 8) {
        throw Object.assign(
            new Error("Admin password must be at least 8 characters."),
            { statusCode: 400 }
        );
    }

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

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await client.query(
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

        const company = result.rows[0];

        let onboard;
        try {
            onboard = await onboardCompanyDefaults({
                companyId: company.id,
                adminEmail: admin_email,
                adminPassword: admin_password,
                adminFirstName: admin_first_name || "Company",
                adminLastName: admin_last_name || "Admin",
                adminPhone: phone || null,
                createdBy: loggedInUserId,
                db: client,
            });
        } catch (onboardError) {
            await client.query("ROLLBACK");
            throw onboardError;
        }

        await client.query("COMMIT");

        return {
            ...company,
            company_admin: {
                id: onboard.company_admin.id,
                email: onboard.company_admin.email,
                first_name: onboard.company_admin.first_name,
                last_name: onboard.company_admin.last_name,
                role: "Company Admin",
            },
            default_roles: onboard.roles.map((r) => r.role_name),
        };
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (_) {
            // ignore
        }
        throw error;
    } finally {
        client.release();
    }

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
const getCompanyByIdService = async (companyId, loggedInUser = null) => {

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

    if (
        loggedInUser &&
        loggedInUser.userType !== "SYSTEM_ADMIN" &&
        Number(loggedInUser.companyId) !== Number(companyId)
    ) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
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
    loggedInUserId,
    loggedInUser = null
) => {

    if (
        loggedInUser &&
        loggedInUser.userType !== "SYSTEM_ADMIN" &&
        Number(loggedInUser.companyId) !== Number(companyId)
    ) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }

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