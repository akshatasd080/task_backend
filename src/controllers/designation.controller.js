const { validationResult } = require("express-validator");

const {
    getDesignationsService,
    getDesignationByIdService,
    createDesignationService,
    updateDesignationService,
    deleteDesignationService,
} = require("../services/designation.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

const getDesignations = async (req, res) => {
    try {
        const designations = await getDesignationsService(req.user, req.query);
        return successResponse(res, "Designations fetched successfully.", designations, 200);
    } catch (error) {
        return errorResponse(res, error.message, error.statusCode || 500);
    }
};

const getDesignationById = async (req, res) => {
    try {
        const designation = await getDesignationByIdService(req.params.id, req.user);
        return successResponse(res, "Designation fetched successfully.", designation, 200);
    } catch (error) {
        return errorResponse(res, error.message, error.statusCode || 404);
    }
};

const createDesignation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array()[0].msg, 400);
        }
        const result = await createDesignationService(req.body, req.user);
        return successResponse(res, "Designation created successfully.", result, 201);
    } catch (error) {
        return errorResponse(res, error.message, error.statusCode || 400);
    }
};

const updateDesignation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errorResponse(res, errors.array()[0].msg, 400);
        }
        const result = await updateDesignationService(req.params.id, req.body, req.user);
        return successResponse(res, "Designation updated successfully.", result, 200);
    } catch (error) {
        return errorResponse(res, error.message, error.statusCode || 400);
    }
};

const deleteDesignation = async (req, res) => {
    try {
        const result = await deleteDesignationService(req.params.id, req.user);
        return successResponse(res, "Designation deleted successfully.", result, 200);
    } catch (error) {
        return errorResponse(res, error.message, error.statusCode || 400);
    }
};

module.exports = {
    getDesignations,
    getDesignationById,
    createDesignation,
    updateDesignation,
    deleteDesignation,
};
