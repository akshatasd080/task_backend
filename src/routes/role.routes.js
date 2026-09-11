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
    getPermissions,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
} = require("../controllers/role.controller");


/**
 * ==========================================================
 * Get All Permissions
 * GET /api/v1/roles/permissions
 * ==========================================================
 */
router.get(
    "/permissions",
    authenticate,
    requirePermission("role.view", "manage_roles"),
    getPermissions
);


/**
 * ==========================================================
 * Get All Roles
 * GET /api/v1/roles
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    requirePermission("role.view", "manage_roles"),
    getRoles
);


/**
 * ==========================================================
 * Create Role
 * POST /api/v1/roles/create
 * ==========================================================
 */
router.post(
    "/create",
    authenticate,
    requirePermission("role.create", "manage_roles"),
    [
        body("role_name")
            .trim()
            .notEmpty()
            .withMessage("Role name is required.")
            .isLength({ min: 2, max: 100 })
            .withMessage("Role name must be between 2 and 100 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 300 })
            .withMessage("Description cannot exceed 300 characters."),

        body("is_active")
            .optional()
            .isBoolean()
            .withMessage("is_active must be true or false."),

        body("permission_ids")
            .optional()
            .isArray()
            .withMessage("permission_ids must be an array."),

        body("permission_ids.*")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Each permission ID must be a valid integer."),

        body("company_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Company ID must be a valid integer."),
    ],
    createRole
);


/**
 * ==========================================================
 * Get Role By ID
 * GET /api/v1/roles/:id
 * ==========================================================
 */
router.get(
    "/:id",
    authenticate,
    requirePermission("role.view", "manage_roles"),
    getRoleById
);


/**
 * ==========================================================
 * Update Role
 * PUT /api/v1/roles/:id
 * ==========================================================
 */
router.put(
    "/:id",
    authenticate,
    requirePermission("role.update", "manage_roles"),
    [
        body("role_name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Role name cannot be empty.")
            .isLength({ min: 2, max: 100 })
            .withMessage("Role name must be between 2 and 100 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 300 })
            .withMessage("Description cannot exceed 300 characters."),

        body("is_active")
            .optional()
            .isBoolean()
            .withMessage("is_active must be true or false."),

        body("permission_ids")
            .optional()
            .isArray()
            .withMessage("permission_ids must be an array."),

        body("permission_ids.*")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Each permission ID must be a valid integer."),
    ],
    updateRole
);


/**
 * ==========================================================
 * Delete Role (Soft Delete)
 * DELETE /api/v1/roles/:id
 * ==========================================================
 */
router.delete(
    "/:id",
    authenticate,
    requirePermission("role.delete", "manage_roles"),
    deleteRole
);


module.exports = router;
