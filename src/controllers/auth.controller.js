const { validationResult } = require("express-validator");

const {
    loginService,
    getProfileService,
    logoutService,
    changePasswordService,
    updateProfileService,
} = require("../services/auth.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Login Controller
 * ==========================================================
 */
const login = async (req, res) => {

    try {

        // Validate Request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const { email, password } = req.body;

        const result = await loginService(
            email,
            password
        );

        return successResponse(
            res,
            "Login Successful",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("LOGIN ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 401
        );

    }

};


/**
 * ==========================================================
 * Get Logged-in User Profile
 * ==========================================================
 */
const getProfile = async (req, res) => {

    try {

        const profile = await getProfileService(req.user);

        return successResponse(
            res,
            "Profile fetched successfully.",
            profile,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("PROFILE ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 500
        );

    }

};


/**
 * ==========================================================
 * Logout Controller
 * ==========================================================
 */
const logout = async (req, res) => {

    try {

        const result = await logoutService(req.user);

        return successResponse(
            res,
            "Logout Successful.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("LOGOUT ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            500
        );

    }

};

/**
 * ==========================================================
 * Change Password Controller
 * ==========================================================
 */
const changePassword = async (req, res) => {

    try {

        // ==================================================
        // Validate Request
        // ==================================================

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const {
            currentPassword,
            newPassword,
        } = req.body;

        const result = await changePasswordService(
            req.user,
            currentPassword,
            newPassword
        );

        return successResponse(
            res,
            result.message,
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("CHANGE PASSWORD ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            400
        );

    }

};


/**
 * ==========================================================
 * Update Logged-in User Profile
 * ==========================================================
 */
const updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array()[0].msg, 400);
        }

        const profile = await updateProfileService(req.user, req.body, req.file);
        return successResponse(res, "Profile updated successfully.", profile, 200);
    } catch (error) {
        console.error("UPDATE PROFILE ERROR", error.message);
        return errorResponse(res, error.message, error.statusCode || 400);
    }
};

module.exports = {
    login,
    getProfile,
    logout,
    changePassword,
    updateProfile,
};

