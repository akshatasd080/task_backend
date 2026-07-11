const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { generateToken } = require("../config/jwt");

/**
 * ==========================================================
 * Login Service
 * ==========================================================
 */
const loginService = async (email, password) => {

    // ======================================================
    // Check System Admin
    // ======================================================

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

        const isPasswordMatched = await bcrypt.compare(
            password,
            admin.password
        );

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
            user: admin,
        };

    }

    // ======================================================
    // Check Company User
    // ======================================================

    const userResult = await pool.query(
        `
        SELECT *
        FROM task_management.users
        WHERE email = $1
        AND is_active = TRUE
        `,
        [email]
    );

    if (userResult.rows.length === 0) {
        throw new Error("Invalid Email or Password");
    }

    const user = userResult.rows[0];

    const isPasswordMatched = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordMatched) {
        throw new Error("Invalid Email or Password");
    }

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

    delete user.password;

    return {
        token,
        user,
    };

};


/**
 * ==========================================================
 * Get Logged-in User Profile
 * ==========================================================
 */
const getProfileService = async (loggedInUser) => {

    // ======================================================
    // System Admin Profile
    // ======================================================

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
        };

    }

    // ======================================================
    // Company User Profile
    // ======================================================

    const result = await pool.query(
        `
        SELECT
            id,
            company_id,
            role_id,
            first_name,
            last_name,
            email,
            phone,
            profile_image,
            is_active,
            last_login,
            created_at,
            updated_at
        FROM task_management.users
        WHERE id = $1
        `,
        [loggedInUser.id]
    );

    if (result.rows.length === 0) {
        throw new Error("User not found.");
    }

    return {
        ...result.rows[0],
        userType: "COMPANY_USER",
    };

};


/**
 * ==========================================================
 * Logout Service
 * ==========================================================
 */
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

/**
 * ==========================================================
 * Change Password Service
 * ==========================================================
 */
const changePasswordService = async (
    loggedInUser,
    currentPassword,
    newPassword
) => {

    let tableName = "";
    let user = null;

    // ======================================================
    // System Admin
    // ======================================================

    if (loggedInUser.userType === "SYSTEM_ADMIN") {

        tableName = "task_management.system_admins";

    } else {

        tableName = "task_management.users";

    }

    // ======================================================
    // Get User
    // ======================================================

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

    user = result.rows[0];

    // ======================================================
    // Verify Current Password
    // ======================================================

    const isPasswordMatched = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordMatched) {
        throw new Error("Current password is incorrect.");
    }

    // ======================================================
    // Prevent Same Password
    // ======================================================

    const isSamePassword = await bcrypt.compare(
        newPassword,
        user.password
    );

    if (isSamePassword) {
        throw new Error(
            "New password cannot be same as current password."
        );
    }

    // ======================================================
    // Hash New Password
    // ======================================================

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ======================================================
    // Update Password
    // ======================================================

    await pool.query(
        `
        UPDATE ${tableName}
        SET
            password = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
            hashedPassword,
            loggedInUser.id,
        ]
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
