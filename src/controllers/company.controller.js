const { validationResult } = require("express-validator");

const {
    createCompanyService,
    getAllCompaniesService,
} = require("../services/company.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Create Company
 * ==========================================================
 */
const createCompany = async (req, res) => {

    try {

        // ==================================================
        // Validate Request
        // ==================================================

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const result = await createCompanyService(
            req.body,
            req.user.id
        );

        return successResponse(
            res,
            "Company created successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("CREATE COMPANY ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            400
        );

    }

};


/**
 * ==========================================================
 * Get All Companies
 * ==========================================================
 */
const getAllCompanies = async (req, res) => {

    try {

        const companies = await getAllCompaniesService();

        return successResponse(
            res,
            "Companies fetched successfully.",
            companies,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET ALL COMPANIES ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            500
        );

    }

};


module.exports = {
    createCompany,
    getAllCompanies,
};