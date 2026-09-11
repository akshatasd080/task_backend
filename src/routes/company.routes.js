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
    emailField,
    phoneField,
} = require("../validators/common");

const {
    logoUpload,
    handleUploadError,
} = require("../middleware/upload.middleware");

const {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    updateCompanyStatus,
    deleteCompany,
    updateCompanyAdminLogin,
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
    logoUpload.single("logo"),
    handleUploadError,
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

        emailField("email", { label: "Company email" }),
        phoneField("phone", { required: true }),

        body("address")
            .trim()
            .notEmpty()
            .withMessage("Address is required.")
            .isLength({ max: 200 })
            .withMessage("Address cannot exceed 200 characters."),

        emailField("admin_email", { label: "Admin email" }),

        body("admin_password")
            .notEmpty()
            .withMessage("Company admin password is required.")
            .isLength({ min: 8 })
            .withMessage("Admin password must be at least 8 characters."),

        body("admin_first_name")
            .trim()
            .notEmpty()
            .withMessage("Admin first name is required.")
            .isLength({ max: 100 })
            .withMessage("Admin first name is invalid."),

        body("admin_last_name")
            .trim()
            .notEmpty()
            .withMessage("Admin last name is required.")
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
    logoUpload.single("logo"),
    handleUploadError,
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

        emailField("email", { label: "Company email" }),
        phoneField("phone"),

        body("address")
            .optional({ checkFalsy: true }),

        body("country")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 80 })
            .withMessage("Country is too long."),

        body("state")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 80 })
            .withMessage("State is too long."),

        body("city")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 80 })
            .withMessage("City is too long."),

        body("pincode")
            .optional({ checkFalsy: true })
            .customSanitizer((value) => String(value ?? "").replace(/\D/g, "").slice(0, 10))
            .isLength({ min: 4, max: 10 })
            .withMessage("Enter a valid pincode."),
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
 * Update Company Admin email / password
 * PUT /api/v1/company/:id/admin-login
 * ==========================================================
 */
router.put(
    "/:id/admin-login",
    authenticate,
    authorize("SYSTEM_ADMIN"),
    [
        emailField("admin_email", { required: false, label: "Admin email" }),

        body("admin_password")
            .optional({ checkFalsy: true })
            .isLength({ min: 8 })
            .withMessage("Admin password must be at least 8 characters."),
    ],
    updateCompanyAdminLogin
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