const express = require("express");

const router = express.Router();

const {
    login,
    getProfile,
    logout,
    changePassword,
} = require("../controllers/auth.controller");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const {
    body,
} = require("express-validator");

const {
    emailField,
} = require("../validators/common");


/**
 * ==========================================================
 * Login
 * POST /api/v1/auth/login
 * ==========================================================
 */
router.post(
    "/login",
    [
        emailField("email"),

        body("password")
            .notEmpty()
            .withMessage("Password is required."),
    ],
    login
);


/**
 * ==========================================================
 * Get Logged-in User Profile
 * GET /api/v1/auth/profile
 * ==========================================================
 */
router.get(
    "/profile",
    authenticate,
    getProfile
);


/**
 * ==========================================================
 * Logout
 * POST /api/v1/auth/logout
 * ==========================================================
 */
router.post(
    "/logout",
    authenticate,
    logout
);


/**
 * ==========================================================
 * Change Password
 * POST /api/v1/auth/change-password
 * ==========================================================
 */
router.post(
    "/change-password",
    authenticate,
    [
        body("currentPassword")
            .notEmpty()
            .withMessage("Current password is required."),

        body("newPassword")
            .notEmpty()
            .withMessage("New password is required.")
            .isLength({ min: 8 })
            .withMessage("New password must be at least 8 characters long.")
            .matches(/[A-Z]/)
            .withMessage("New password must contain at least one uppercase letter.")
            .matches(/[a-z]/)
            .withMessage("New password must contain at least one lowercase letter.")
            .matches(/[0-9]/)
            .withMessage("New password must contain at least one number.")
            .matches(/[@$!%*?&]/)
            .withMessage("New password must contain at least one special character."),
    ],
    changePassword
);

module.exports = router;