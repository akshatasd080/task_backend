const {
    getNotificationsService,
    markAsReadService,
    markAllAsReadService,
    getUnreadCountService,
} = require("../services/notification.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Get Notifications
 * ==========================================================
 */
const getNotifications = async (req, res) => {

    try {

        const notifications = await getNotificationsService(
            req.user,
            req.query
        );

        return successResponse(
            res,
            "Notifications fetched successfully.",
            notifications,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET NOTIFICATIONS ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 500
        );

    }

};


/**
 * ==========================================================
 * Get Unread Count
 * ==========================================================
 */
const getUnreadCount = async (req, res) => {

    try {

        const result = await getUnreadCountService(req.user);

        return successResponse(
            res,
            "Unread count fetched successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET UNREAD COUNT ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 500
        );

    }

};


/**
 * ==========================================================
 * Mark Notification As Read
 * ==========================================================
 */
const markAsRead = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await markAsReadService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Notification marked as read.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("MARK NOTIFICATION READ ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 400
        );

    }

};


/**
 * ==========================================================
 * Mark All Notifications As Read
 * ==========================================================
 */
const markAllAsRead = async (req, res) => {

    try {

        const result = await markAllAsReadService(req.user);

        return successResponse(
            res,
            "All notifications marked as read.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("MARK ALL NOTIFICATIONS READ ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 400
        );

    }

};


module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
