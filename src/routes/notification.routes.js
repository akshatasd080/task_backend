const express = require("express");

const router = express.Router();

const {
    authenticate,
} = require("../middleware/auth.middleware");

const {
    requirePermission,
} = require("../middleware/permission.middleware");

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = require("../controllers/notification.controller");


/**
 * ==========================================================
 * Get Notifications
 * GET /api/v1/notifications
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    requirePermission("notification.view"),
    getNotifications
);


/**
 * ==========================================================
 * Get Unread Count
 * GET /api/v1/notifications/unread-count
 * ==========================================================
 */
router.get(
    "/unread-count",
    authenticate,
    requirePermission("notification.view"),
    getUnreadCount
);


/**
 * ==========================================================
 * Mark All As Read
 * PUT /api/v1/notifications/read-all
 * ==========================================================
 */
router.put(
    "/read-all",
    authenticate,
    requirePermission("notification.view"),
    markAllAsRead
);


/**
 * ==========================================================
 * Mark Notification As Read
 * PUT /api/v1/notifications/:id/read
 * ==========================================================
 */
router.put(
    "/:id/read",
    authenticate,
    requirePermission("notification.view"),
    markAsRead
);


module.exports = router;
