const express = require("express");

const router = express.Router();

const {
    body,
} = require("express-validator");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    updateDepartmentStatus,
    deleteDepartment,
} = require("../controllers/department.controller");


/**
 * ==========================================================
 * Create Department
 * POST /api/v1/department/create
 * ==========================================================
 */
router.post(
    "/create",
    authenticate,
    [
        body("company_id")
            .notEmpty()
            .withMessage("Company is required.")
            .isInt({ min: 1 })
            .withMessage("Company ID must be a valid integer."),

        body("department_name")
            .trim()
            .notEmpty()
            .withMessage("Department name is required.")
            .isLength({ min: 2, max: 100 })
            .withMessage("Department name must be between 2 and 100 characters."),

        body("department_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 2, max: 20 })
            .withMessage("Department code must be between 2 and 20 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 500 })
            .withMessage("Description cannot exceed 500 characters."),
    ],
    createDepartment
);


/**
 * ==========================================================
 * Get All Departments
 * GET /api/v1/department
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    getAllDepartments
);


/**
 * ==========================================================
 * Get Department By ID
 * GET /api/v1/department/:id
 * ==========================================================
 */
router.get(
    "/:id",
    authenticate,
    getDepartmentById
);


/**
 * ==========================================================
 * Update Department 
 * PUT /api/v1/department/:id
 * ==========================================================
 */
router.put(
    "/:id",
    authenticate,
    [
        body("company_id")
            .notEmpty()
            .withMessage("Company is required.")
            .isInt({ min: 1 })
            .withMessage("Company ID must be a valid integer."),

        body("department_name")
            .trim()
            .notEmpty()
            .withMessage("Department name is required.")
            .isLength({ min: 2, max: 100 })
            .withMessage("Department name must be between 2 and 100 characters."),

        body("department_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 2, max: 20 })
            .withMessage("Department code must be between 2 and 20 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 500 })
            .withMessage("Description cannot exceed 500 characters."),
    ],
    updateDepartment
);


/**
 * ==========================================================
 * Activate / Deactivate Department
 * PATCH /api/v1/department/:id/status
 * ==========================================================
 */
router.patch(
    "/:id/status",
    authenticate,
    [
        body("is_active")
            .notEmpty()
            .withMessage("is_active is required.")
            .isBoolean()
            .withMessage("is_active must be true or false."),
    ],
    updateDepartmentStatus
);


/**
 * ==========================================================
 * Delete Department (Soft Delete)
 * DELETE /api/v1/department/:id
 * ==========================================================
 */
router.delete(
    "/:id",
    authenticate,
    deleteDepartment
);


module.exports = router;


