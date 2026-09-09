const express = require("express");

const router = express.Router();

const {
    authenticate,
} = require("../middleware/auth.middleware");

const {
    requirePermission,
} = require("../middleware/permission.middleware");

const {
    getDashboard,
    getReports,
} = require("../controllers/dashboard.controller");


/**
 * ==========================================================
 * Get Dashboard
 * GET /api/v1/dashboard
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    requirePermission("dashboard.view"),
    getDashboard
);


/**
 * ==========================================================
 * Get Reports
 * GET /api/v1/dashboard/reports
 * ==========================================================
 */
router.get(
    "/reports",
    authenticate,
    requirePermission("reports.view", "dashboard.view"),
    getReports
);


module.exports = router;
