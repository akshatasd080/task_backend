const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const {
    getDesignations,
    getDesignationById,
    createDesignation,
    updateDesignation,
    deleteDesignation,
} = require("../controllers/designation.controller");

const router = express.Router();

router.get(
    "/",
    authenticate,
    requirePermission(
        "designation.view",
        "designation.create",
        "user.create",
        "user.update",
        "manage_users"
    ),
    getDesignations
);

router.post(
    "/create",
    authenticate,
    requirePermission("designation.create", "manage_users"),
    [
        body("designation_name")
            .trim()
            .notEmpty()
            .withMessage("Designation name is required.")
            .isLength({ min: 2, max: 100 })
            .withMessage("Designation name must be between 2 and 100 characters."),
        body("description")
            .optional({ checkFalsy: true })
            .trim(),
    ],
    createDesignation
);

router.get(
    "/:id",
    authenticate,
    requirePermission("designation.view", "manage_users"),
    getDesignationById
);

router.put(
    "/:id",
    authenticate,
    requirePermission("designation.update", "manage_users"),
    [
        body("designation_name")
            .trim()
            .notEmpty()
            .withMessage("Designation name is required.")
            .isLength({ min: 2, max: 100 })
            .withMessage("Designation name must be between 2 and 100 characters."),
        body("description")
            .optional({ checkFalsy: true })
            .trim(),
    ],
    updateDesignation
);

router.delete(
    "/:id",
    authenticate,
    requirePermission("designation.delete", "manage_users"),
    deleteDesignation
);

module.exports = router;
