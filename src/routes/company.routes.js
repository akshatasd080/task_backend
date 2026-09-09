const express = require("express");

const router = express.Router();

const {
    body,
} = require("express-validator");

const {
    authenticate,
    authorize,
} = require("../middleware/auth.middleware");

const {
    requirePermission,
} = require("../middleware/permission.middleware");

const {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    updateCompanyStatus,
    deleteCompany,
} = require("../controllers/company.controller");


/**
 * ==========================================================
 * Create Company
 * POST /api/v1/company/create
 * ==========================================================
 */
router.post(
    "/create",
    authenticate,
    authorize("SYSTEM_ADMIN"),
    [
        body("company_name")
            .trim()
            .notEmpty()
            .withMessage("Company name is required.")
            .isLength({ min: 3, max: 150 })
            .withMessage("Company name must be between 3 and 150 characters."),

        body("company_code")
            .trim()
            .notEmpty()
            .withMessage("Company code is required.")
            .isLength({ min: 2, max: 20 })
            .withMessage("Company code must be between 2 and 20 characters."),

        body("email")
            .trim()
            .notEmpty()
            .withMessage("Company email is required.")
            .isEmail()
            .withMessage("Please enter a valid email address."),

        body("phone")
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 20 })
            .withMessage("Phone number must be between 10 and 20 characters."),

        body("address")
            .optional({ checkFalsy: true })
            .isLength({ max: 500 })
            .withMessage("Address cannot exceed 500 characters."),

        body("logo_url")
            .optional({ checkFalsy: true })
            .isURL()
            .withMessage("Logo URL must be a valid URL."),

        body("admin_email")
            .trim()
            .notEmpty()
            .withMessage("Company admin email is required.")
            .isEmail()
            .withMessage("Please enter a valid admin email."),

        body("admin_password")
            .notEmpty()
            .withMessage("Company admin password is required.")
            .isLength({ min: 8 })
            .withMessage("Admin password must be at least 8 characters."),

        body("admin_first_name")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage("Admin first name is invalid."),

        body("admin_last_name")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage("Admin last name is invalid."),
    ],
    createCompany
);


/**
 * ==========================================================
 * Get All Companies
 * GET /api/v1/company
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    authorize("SYSTEM_ADMIN"),
    getAllCompanies
);


/**
 * ==========================================================
 * Get Company By ID
 * GET /api/v1/company/:id
 * ==========================================================
 */
router.get(
    "/:id",
    authenticate,
    requirePermission("company.view", "company.update", "company.manage", "company.create"),
    getCompanyById
);


/**
 * ==========================================================
 * Update Company
 * PUT /api/v1/company/:id
 * ==========================================================
 */
router.put(
    "/:id",
    authenticate,
    requirePermission("company.update", "company.manage"),
    [
        body("company_name")
            .trim()
            .notEmpty()
            .withMessage("Company name is required.")
            .isLength({ min: 3, max: 150 })
            .withMessage("Company name must be between 3 and 150 characters."),

        body("company_code")
            .trim()
            .notEmpty()
            .withMessage("Company code is required.")
            .isLength({ min: 2, max: 20 })
            .withMessage("Company code must be between 2 and 20 characters."),

        body("email")
            .trim()
            .notEmpty()
            .withMessage("Company email is required.")
            .isEmail()
            .withMessage("Please enter a valid email address."),

        body("phone")
            .optional({ checkFalsy: true })
            .isLength({ min: 10, max: 20 })
            .withMessage("Phone number must be between 10 and 20 characters."),

        body("address")
            .optional({ checkFalsy: true })
            .isLength({ max: 500 })
            .withMessage("Address cannot exceed 500 characters."),

        body("logo_url")
            .optional({ checkFalsy: true })
            .isURL()
            .withMessage("Logo URL must be a valid URL."),
    ],
    updateCompany
);


/**
 * ==========================================================
 * Activate / Deactivate Company
 * PATCH /api/v1/company/:id/status
 * ==========================================================
 */
router.patch(
    "/:id/status",
    authenticate,
    authorize("SYSTEM_ADMIN"),
    [
        body("is_active")
            .notEmpty()
            .withMessage("is_active is required.")
            .isBoolean()
            .withMessage("is_active must be true or false."),
    ],
    updateCompanyStatus
);


/**
 * ==========================================================
 * Delete Company (Soft Delete)
 * DELETE /api/v1/company/:id
 * ==========================================================
 */
router.delete(
    "/:id",
    authenticate,
    authorize("SYSTEM_ADMIN"),
    deleteCompany
);


module.exports = router;