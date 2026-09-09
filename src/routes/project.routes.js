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
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} = require("../controllers/project.controller");


/**
 * ==========================================================
 * Get All Projects
 * GET /api/v1/projects
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    requirePermission("project.view"),
    getProjects
);


/**
 * ==========================================================
 * Create Project
 * POST /api/v1/projects/create
 * ==========================================================
 */
router.post(
    "/create",
    authenticate,
    requirePermission("project.create"),
    [
        body("project_name")
            .trim()
            .notEmpty()
            .withMessage("Project name is required.")
            .isLength({ min: 2, max: 150 })
            .withMessage("Project name must be between 2 and 150 characters."),

        body("project_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage("Project code must be between 2 and 50 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 2000 })
            .withMessage("Description cannot exceed 2000 characters."),

        body("start_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("Start date must be a valid date."),

        body("end_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("End date must be a valid date."),

        body("status")
            .optional()
            .isIn(["Planning", "Active", "On Hold", "Completed", "Cancelled"])
            .withMessage("Invalid project status."),

        body("priority")
            .optional()
            .isIn(["Low", "Medium", "High", "Urgent"])
            .withMessage("Invalid project priority."),

        body("member_ids")
            .optional()
            .isArray()
            .withMessage("member_ids must be an array."),

        body("member_ids.*")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Each member ID must be a valid integer."),

        body("company_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Company ID must be a valid integer."),
    ],
    createProject
);


/**
 * ==========================================================
 * Get Project By ID
 * GET /api/v1/projects/:id
 * ==========================================================
 */
router.get(
    "/:id",
    authenticate,
    requirePermission("project.view"),
    getProjectById
);


/**
 * ==========================================================
 * Update Project
 * PUT /api/v1/projects/:id
 * ==========================================================
 */
router.put(
    "/:id",
    authenticate,
    requirePermission("project.update"),
    [
        body("project_name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Project name cannot be empty.")
            .isLength({ min: 2, max: 150 })
            .withMessage("Project name must be between 2 and 150 characters."),

        body("project_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage("Project code must be between 2 and 50 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 2000 })
            .withMessage("Description cannot exceed 2000 characters."),

        body("start_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("Start date must be a valid date."),

        body("end_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("End date must be a valid date."),

        body("status")
            .optional()
            .isIn(["Planning", "Active", "On Hold", "Completed", "Cancelled"])
            .withMessage("Invalid project status."),

        body("priority")
            .optional()
            .isIn(["Low", "Medium", "High", "Urgent"])
            .withMessage("Invalid project priority."),

        body("member_ids")
            .optional()
            .isArray()
            .withMessage("member_ids must be an array."),

        body("member_ids.*")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Each member ID must be a valid integer."),
    ],
    updateProject
);


/**
 * ==========================================================
 * Delete Project (Soft Delete)
 * DELETE /api/v1/projects/:id
 * ==========================================================
 */
router.delete(
    "/:id",
    authenticate,
    requirePermission("project.delete"),
    deleteProject
);


module.exports = router;
