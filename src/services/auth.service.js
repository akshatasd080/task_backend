const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { generateToken } = require("../config/jwt");
const {
    getPermissionsByRoleId,
    getCompanyUserAccess,
    assertCompanyUserCanAccess,
    COMPANY_DEACTIVATED_MESSAGE,
} = require("../utils/helpers");
const { SUPER_ADMIN_PERMISSIONS } = require("../utils/companyOnboard");

const buildCompanyUserPayload = async (user) => {
    const roleResult = await pool.query(
        `
        SELECT id, role_name
        FROM task_management.roles
        WHERE id = $1
        `,
        [user.role_id]
    );

    const roleName = roleResult.rows[0]?.role_name || null;
    const permissions = await getPermissionsByRoleId(user.role_id);

    const companyResult = await pool.query(
        `
        SELECT id, company_name, company_code, is_active, logo_url
        FROM task_management.companies
        WHERE id = $1 AND deleted_at IS NULL
        `,
        [user.company_id]
    );

    const company = companyResult.rows[0] || null;

    if (!company || company.is_active !== true) {
        const error = new Error(COMPANY_DEACTIVATED_MESSAGE);
        error.statusCode = 401;
        throw error;
    }

    return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        profile_image: user.profile_image,
        company_id: user.company_id,
        role_id: user.role_id,
        role_name: roleName,
        permissions,
        company,
        userType: "COMPANY_USER",
        is_active: user.is_active,
        last_login: user.last_login,
    };
};

/**
 * Login Service
 */
const loginService = async (email, password) => {
    const adminResult = await pool.query(
        `
        SELECT *
        FROM task_management.system_admins
        WHERE email = $1
        AND is_active = TRUE
        `,
        [email]
    );

    if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];

        const isPasswordMatched = await bcrypt.compare(password, admin.password);

        if (!isPasswordMatched) {
            throw new Error("Invalid Email or Password");
        }

        await pool.query(
            `
            UPDATE task_management.system_admins
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [admin.id]
        );

        const token = generateToken({
            id: admin.id,
            email: admin.email,
            userType: "SYSTEM_ADMIN",
        });

        delete admin.password;

        return {
            token,
            user: {
                ...admin,
                userType: "SYSTEM_ADMIN",
                role_name: "Super Admin",
                permissions: SUPER_ADMIN_PERMISSIONS,
                company_id: null,
                company: null,
            },
        };
    }

    const userResult = await pool.query(
        `
        SELECT *
        FROM task_management.users
        WHERE email = $1
        AND is_active = TRUE
        AND deleted_at IS NULL
        `,
        [email]
    );

    if (userResult.rows.length === 0) {
        throw new Error("Invalid Email or Password");
    }

    const user = userResult.rows[0];

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
        throw new Error("Invalid Email or Password");
    }

    const access = await getCompanyUserAccess(user.id);
    assertCompanyUserCanAccess(access);

    await pool.query(
        `
        UPDATE task_management.users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [user.id]
    );

    const token = generateToken({
        id: user.id,
        email: user.email,
        companyId: user.company_id,
        roleId: user.role_id,
        userType: "COMPANY_USER",
    });

    const profile = await buildCompanyUserPayload(user);

    return {
        token,
        user: profile,
    };
};

/**
 * Get Logged-in User Profile
 */
const getProfileService = async (loggedInUser) => {
    if (loggedInUser.userType === "SYSTEM_ADMIN") {
        const result = await pool.query(
            `
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                profile_image,
                is_active,
                last_login,
                created_at,
                updated_at
            FROM task_management.system_admins
            WHERE id = $1
            `,
            [loggedInUser.id]
        );

        if (result.rows.length === 0) {
            throw new Error("User not found.");
        }

        return {
            ...result.rows[0],
            userType: "SYSTEM_ADMIN",
            role_name: "Super Admin",
            permissions: SUPER_ADMIN_PERMISSIONS,
            company_id: null,
            company: null,
        };
    }

    const result = await pool.query(
        `
        SELECT *
        FROM task_management.users
        WHERE id = $1
        AND deleted_at IS NULL
        `,
        [loggedInUser.id]
    );

    if (result.rows.length === 0) {
        throw new Error("User not found.");
    }

    return buildCompanyUserPayload(result.rows[0]);
};

const logoutService = async (loggedInUser) => {
    return {
        success: true,
        message: "Logout Successful.",
        user: {
            id: loggedInUser.id,
            userType: loggedInUser.userType,
        },
    };
};

const changePasswordService = async (
    loggedInUser,
    currentPassword,
    newPassword
) => {
    let tableName = "";

    if (loggedInUser.userType === "SYSTEM_ADMIN") {
        tableName = "task_management.system_admins";
    } else {
        tableName = "task_management.users";
    }

    const result = await pool.query(
        `
        SELECT id, password
        FROM ${tableName}
        WHERE id = $1
        `,
        [loggedInUser.id]
    );

    if (result.rows.length === 0) {
        throw new Error("User not found.");
    }

    const user = result.rows[0];

    const isPasswordMatched = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordMatched) {
        throw new Error("Current password is incorrect.");
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
        throw new Error("New password cannot be same as current password.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
        `
        UPDATE ${tableName}
        SET
            password = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [hashedPassword, loggedInUser.id]
    );

    return {
        success: true,
        message: "Password changed successfully.",
    };
};

module.exports = {
    loginService,
    getProfileService,
    logoutService,
    changePasswordService,
};
