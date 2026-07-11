const { validationResult } = require("express-validator");

const {
    createCompanyService,
    getAllCompaniesService,
    getCompanyByIdService,
    updateCompanyService,
    updateCompanyStatusService,
    deleteCompanyService,
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


/**
 * ==========================================================
 * Get Company By ID
 * ==========================================================
 */
const getCompanyById = async (req, res) => {

    try {

        const { id } = req.params;

        const company = await getCompanyByIdService(id);

        return successResponse(
            res,
            "Company fetched successfully.",
            company,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET COMPANY BY ID ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            404
        );

    }

};


/**
 * ==========================================================
 * Update Company
 * ==========================================================
 */
const updateCompany = async (req, res) => {

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

        const { id } = req.params;

        const result = await updateCompanyService(
            id,
            req.body,
            req.user.id
        );

        return successResponse(
            res,
            "Company updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE COMPANY ERROR");
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
 * Update Company Status (Activate / Deactivate)
 * ==========================================================
 */
const updateCompanyStatus = async (req, res) => {

    try {

        const { id } = req.params;

        const { is_active } = req.body;

        // ==================================================
        // Validate Status
        // ==================================================

        if (typeof is_active !== "boolean") {

            return errorResponse(
                res,
                "is_active must be true or false.",
                400
            );

        }

        const result = await updateCompanyStatusService(
            id,
            is_active,
            req.user.id
        );

        return successResponse(
            res,
            "Company status updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE COMPANY STATUS ERROR");
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
 * Delete Company (Soft Delete)
 * ==========================================================
 */
const deleteCompany = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await deleteCompanyService(
            id,
            req.user.id
        );

        return successResponse(
            res,
            "Company deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE COMPANY ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            400
        );

    }

};


module.exports = {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    updateCompanyStatus,
    deleteCompany,
};