const pool = require("../config/db");


/**
 * ==========================================================
 * Create Company Service
 * ==========================================================
 */
const createCompanyService = async (companyData) => {

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
            null,
            null,
        ]
    );

    return result.rows[0];

};


module.exports = {
    createCompanyService,
};