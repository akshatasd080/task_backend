const { validationResult } = require("express-validator");

const {
    getPermissionsService,
    getRolesService,
    getRoleByIdService,
    createRoleService,
    updateRoleService,
    deleteRoleService,
} = require("../services/role.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Get All Permissions
 * ==========================================================
 */
const getPermissions = async (req, res) => {

    try {

        const permissions = await getPermissionsService();

        return successResponse(
            res,
            "Permissions fetched successfully.",
            permissions,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET PERMISSIONS ERROR");
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
 * Get All Roles
 * ==========================================================
 */
const getRoles = async (req, res) => {

    try {

        const roles = await getRolesService(
            req.user,
            req.query
        );

        return successResponse(
            res,
            "Roles fetched successfully.",
            roles,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET ROLES ERROR");
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
 * Get Role By ID
 * ==========================================================
 */
const getRoleById = async (req, res) => {

    try {

        const { id } = req.params;

        const role = await getRoleByIdService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Role fetched successfully.",
            role,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET ROLE BY ID ERROR");
        console.error(error.message);
        console.error("====================================");

        return errorResponse(
            res,
            error.message,
            error.statusCode || 404
        );

    }

};


/**
 * ==========================================================
 * Create Role
 * ==========================================================
 */
const createRole = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const result = await createRoleService(
            req.body,
            req.user
        );

        return successResponse(
            res,
            "Role created successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("CREATE ROLE ERROR");
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
 * Update Role
 * ==========================================================
 */
const updateRole = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const { id } = req.params;

        const result = await updateRoleService(
            id,
            req.body,
            req.user
        );

        return successResponse(
            res,
            "Role updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE ROLE ERROR");
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
 * Delete Role (Soft Delete)
 * ==========================================================
 */
const deleteRole = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await deleteRoleService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Role deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE ROLE ERROR");
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
    getPermissions,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
};
