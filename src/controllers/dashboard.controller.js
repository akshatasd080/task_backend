const {
    getDashboardService,
    getReportsService,
} = require("../services/dashboard.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Get Dashboard
 * ==========================================================
 */
const getDashboard = async (req, res) => {

    try {

        const dashboard = await getDashboardService(req.user);

        return successResponse(
            res,
            "Dashboard fetched successfully.",
            dashboard,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET DASHBOARD ERROR");
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
 * Get Reports
 * ==========================================================
 */
const getReports = async (req, res) => {

    try {

        const reports = await getReportsService(
            req.user,
            req.query
        );

        return successResponse(
            res,
            "Reports fetched successfully.",
            reports,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET REPORTS ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 500
        );

    }

};


module.exports = {
    getDashboard,
    getReports,
};
