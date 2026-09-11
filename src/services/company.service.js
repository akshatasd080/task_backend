const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { onboardCompanyDefaults } = require("../utils/companyOnboard");
const {
    persistCompanyLogo,
    deleteUploadedFile,
} = require("../middleware/upload.middleware");

const COMPANY_FIELDS = `
    id,
    company_name,
    company_code,
    email,
    phone,
    address,
    country,
    state,
    city,
    pincode,
    logo_url,
    notify_all_users,
    allow_self_registration,
    show_in_reports,
    is_active,
    created_by,
    updated_by,
    created_at,
    updated_at
`;

const asBool = (value, fallback = false) => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    const text = String(value).trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(text)) return true;
    if (["false", "0", "no", "off"].includes(text)) return false;
    return fallback;
};

const getCompanyAdminUser = async (companyId) => {
    const result = await pool.query(
        `
        SELECT u.id, u.email, u.first_name, u.last_name, u.company_id
        FROM task_management.users u
        INNER JOIN task_management.roles r ON r.id = u.role_id
        WHERE u.company_id = $1
          AND u.deleted_at IS NULL
          AND r.role_name = 'Company Admin'
        ORDER BY u.id ASC
        LIMIT 1
        `,
        [companyId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(
            new Error("Company Admin not found for this company."),
            { statusCode: 404 }
        );
    }

    return result.rows[0];
};


/**
 * ==========================================================
 * Create Company Service
 * ==========================================================
 */
const createCompanyService = async (
    companyData,
    loggedInUserId,
    logoFile = null
) => {

    const {
        company_name,
        company_code,
        email,
        phone,
        address,
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
                null,
                loggedInUserId,
                loggedInUserId,
            ]
        );

        const company = result.rows[0];

        if (logoFile) {
            const logoPath = persistCompanyLogo(logoFile, company.id);
            const logoResult = await client.query(
                `
                UPDATE task_management.companies
                SET logo_url = $1
                WHERE id = $2
                RETURNING logo_url
                `,
                [logoPath, company.id]
            );
            company.logo_url = logoResult.rows[0]?.logo_url || logoPath;
        }

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
            c.id,
            c.company_name,
            c.company_code,
            c.email,
            c.phone,
            c.address,
            c.country,
            c.state,
            c.city,
            c.pincode,
            c.logo_url,
            c.notify_all_users,
            c.allow_self_registration,
            c.show_in_reports,
            c.is_active,
            c.created_by,
            c.updated_by,
            c.created_at,
            c.updated_at,
            admin.id AS admin_id,
            admin.email AS admin_email,
            admin.first_name AS admin_first_name,
            admin.last_name AS admin_last_name
        FROM task_management.companies c
        LEFT JOIN LATERAL (
            SELECT u.id, u.email, u.first_name, u.last_name
            FROM task_management.users u
            INNER JOIN task_management.roles r ON r.id = u.role_id
            WHERE u.company_id = c.id
              AND u.deleted_at IS NULL
              AND r.role_name = 'Company Admin'
            ORDER BY u.id ASC
            LIMIT 1
        ) admin ON TRUE
        WHERE c.deleted_at IS NULL
        ORDER BY c.id ASC
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
            ${COMPANY_FIELDS}
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
    loggedInUser = null,
    logoFile = null
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
        country,
        state,
        city,
        pincode,
    } = companyData;

    const notifyAllUsers = asBool(companyData.notify_all_users, true);
    const allowSelfRegistration = asBool(companyData.allow_self_registration, false);
    const showInReports = asBool(companyData.show_in_reports, true);
    const removeLogo = asBool(companyData.remove_logo, false);

    // ======================================================
    // Check Company Exists
    // ======================================================

    const companyResult = await pool.query(
        `
        SELECT id, logo_url
        FROM task_management.companies
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [companyId]
    );

    if (companyResult.rows.length === 0) {
        throw new Error("Company not found.");
    }

    const existing = companyResult.rows[0];
    let nextLogo = existing.logo_url || null;

    if (logoFile) {
        nextLogo = persistCompanyLogo(logoFile, companyId);
        if (existing.logo_url && existing.logo_url !== nextLogo) {
            deleteUploadedFile(existing.logo_url);
        }
    } else if (removeLogo && existing.logo_url) {
        deleteUploadedFile(existing.logo_url);
        nextLogo = null;
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
            country = $6,
            state = $7,
            city = $8,
            pincode = $9,
            logo_url = $10,
            notify_all_users = $11,
            allow_self_registration = $12,
            show_in_reports = $13,
            updated_by = $14,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING
            ${COMPANY_FIELDS}
        `,
        [
            company_name,
            company_code,
            email,
            phone || null,
            address || null,
            country ? String(country).trim() : null,
            state ? String(state).trim() : null,
            city ? String(city).trim() : null,
            pincode ? String(pincode).replace(/\D/g, "").slice(0, 10) || null : null,
            nextLogo,
            notifyAllUsers,
            allowSelfRegistration,
            showInReports,
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


/**
 * ==========================================================
 * Update Company Admin email / password (Super Admin)
 * ==========================================================
 */
const updateCompanyAdminLoginService = async (companyId, data, loggedInUserId) => {
    const company = await getCompanyByIdService(companyId);
    const admin = await getCompanyAdminUser(company.id);

    const nextEmail = data.admin_email
        ? String(data.admin_email).trim().toLowerCase()
        : null;
    const nextPassword = data.admin_password
        ? String(data.admin_password)
        : "";

    if (!nextEmail && !nextPassword) {
        throw Object.assign(
            new Error("Provide a new admin email and/or password."),
            { statusCode: 400 }
        );
    }

    if (nextPassword && nextPassword.length < 8) {
        throw Object.assign(
            new Error("Admin password must be at least 8 characters."),
            { statusCode: 400 }
        );
    }

    if (nextEmail && nextEmail !== String(admin.email).toLowerCase()) {
        const emailTaken = await pool.query(
            `
            SELECT id FROM task_management.users
            WHERE email = $1 AND deleted_at IS NULL AND id <> $2
            `,
            [nextEmail, admin.id]
        );
        if (emailTaken.rows.length > 0) {
            throw Object.assign(
                new Error("This email is already used by another user."),
                { statusCode: 400 }
            );
        }
    }

    const hashedPassword = nextPassword
        ? await bcrypt.hash(nextPassword, 10)
        : null;

    const result = await pool.query(
        `
        UPDATE task_management.users
        SET
            email = COALESCE($1, email),
            password = COALESCE($2, password),
            password_changed_at = CASE WHEN $2 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE password_changed_at END,
            updated_by = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, email, first_name, last_name, company_id, updated_at
        `,
        [
            nextEmail || null,
            hashedPassword,
            loggedInUserId,
            admin.id,
        ]
    );

    return {
        company_id: company.id,
        company_name: company.company_name,
        company_admin: {
            id: result.rows[0].id,
            email: result.rows[0].email,
            first_name: result.rows[0].first_name,
            last_name: result.rows[0].last_name,
            role: "Company Admin",
            password_updated: Boolean(nextPassword),
        },
    };
};


module.exports = {
    createCompanyService,
    getAllCompaniesService,
    getCompanyByIdService,
    updateCompanyService,
    updateCompanyStatusService,
    deleteCompanyService,
    updateCompanyAdminLoginService,
};