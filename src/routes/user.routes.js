const express = require("express");

const router = express.Router();

const {
    body,
} = require("express-validator");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const {
    requirePermission,
} = require("../middleware/permission.middleware");

const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
} = require("../controllers/user.controller");


/**
 * ==========================================================
 * Get All Users
 * GET /api/v1/users
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    requirePermission("user.view", "manage_users"),
    getUsers
);


/**
 * ==========================================================
 * Create User
 * POST /api/v1/users/create
 * ==========================================================
 */
router.post(
    "/create",
    authenticate,
    requirePermission("user.create", "manage_users"),
    [
        body("first_name")
            .trim()
            .notEmpty()
            .withMessage("First name is required.")
            .isLength({ min: 2, max: 100 })
            .withMessage("First name must be between 2 and 100 characters."),

        body("last_name")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage("Last name cannot exceed 100 characters."),

        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required.")
            .isEmail()
            .withMessage("Please enter a valid email address."),

        body("password")
            .notEmpty()
            .withMessage("Password is required.")
            .isLength({ min: 6, max: 100 })
            .withMessage("Password must be between 6 and 100 characters."),

        body("role_id")
            .notEmpty()
            .withMessage("Role is required.")
            .isInt({ min: 1 })
            .withMessage("Role ID must be a valid integer."),

        body("phone")
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 20 })
            .withMessage("Phone number must be between 10 and 20 characters."),

        body("department_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Department ID must be a valid integer."),

        body("manager_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Manager ID must be a valid integer."),

        body("employee_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 50 })
            .withMessage("Employee code cannot exceed 50 characters."),

        body("designation")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage("Designation cannot exceed 100 characters."),

        body("company_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Company ID must be a valid integer."),
    ],
    createUser
);


/**
 * ==========================================================
 * Get User By ID
 * GET /api/v1/users/:id
 * ==========================================================
 */
router.get(
    "/:id",
    authenticate,
    requirePermission("user.view", "manage_users"),
    getUserById
);


/**
 * ==========================================================
 * Update User
 * PUT /api/v1/users/:id
 * ==========================================================
 */
router.put(
    "/:id",
    authenticate,
    requirePermission("user.update", "manage_users"),
    [
        body("first_name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("First name cannot be empty.")
            .isLength({ min: 2, max: 100 })
            .withMessage("First name must be between 2 and 100 characters."),

        body("last_name")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage("Last name cannot exceed 100 characters."),

        body("phone")
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 20 })
            .withMessage("Phone number must be between 10 and 20 characters."),

        body("role_id")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Role ID must be a valid integer."),

        body("department_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Department ID must be a valid integer."),

        body("manager_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Manager ID must be a valid integer."),

        body("employee_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 50 })
            .withMessage("Employee code cannot exceed 50 characters."),

        body("designation")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage("Designation cannot exceed 100 characters."),

        body("is_active")
            .optional()
            .isBoolean()
            .withMessage("is_active must be true or false."),
    ],
    updateUser
);


/**
 * ==========================================================
 * Delete User (Soft Delete)
 * DELETE /api/v1/users/:id
 * ==========================================================
 */
router.delete(
    "/:id",
    authenticate,
    requirePermission("user.delete", "manage_users"),
    deleteUser
);


module.exports = router;
