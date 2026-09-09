const { validationResult } = require("express-validator");

const {
    createDepartmentService,
    getAllDepartmentsService,
    getDepartmentByIdService,
    updateDepartmentService,
    updateDepartmentStatusService,
    deleteDepartmentService,
} = require("../services/department.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Create Department
 * ==========================================================
 */
const createDepartment = async (req, res) => {

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

        const result = await createDepartmentService(
            req.body,
            req.user.id
        );

        return successResponse(
            res,
            "Department created successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("CREATE DEPARTMENT ERROR");
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
 * Get All Departments
 * ==========================================================
 */
const getAllDepartments = async (req, res) => {

    try {

        const departments = await getAllDepartmentsService(req.query);

        return successResponse(
            res,
            "Departments fetched successfully.",
            departments,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET ALL DEPARTMENTS ERROR");
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
 * Get Department By ID
 * ==========================================================
 */
const getDepartmentById = async (req, res) => {

    try {

        const { id } = req.params;

        const department = await getDepartmentByIdService(id);

        return successResponse(
            res,
            "Department fetched successfully.",
            department,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET DEPARTMENT BY ID ERROR");
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
 * Update Department
 * ==========================================================
 */
const updateDepartment = async (req, res) => {

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

        const result = await updateDepartmentService(
            id,
            req.body,
            req.user.id
        );

        return successResponse(
            res,
            "Department updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE DEPARTMENT ERROR");
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
 * Update Department Status
 * ==========================================================
 */
const updateDepartmentStatus = async (req, res) => {

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

        const result = await updateDepartmentStatusService(
            id,
            is_active,
            req.user.id
        );

        return successResponse(
            res,
            "Department status updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE DEPARTMENT STATUS ERROR");
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
 * Delete Department (Soft Delete)
 * ==========================================================
 */
const deleteDepartment = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await deleteDepartmentService(
            id,
            req.user.id
        );

        return successResponse(
            res,
            "Department deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE DEPARTMENT ERROR");
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
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    updateDepartmentStatus,
    deleteDepartment,
};


