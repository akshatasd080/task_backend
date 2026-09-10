const { validationResult } = require("express-validator");

const {
    createUserService,
    getUsersService,
    getUserByIdService,
    updateUserService,
    deleteUserService,
    getMyTeamService,
} = require("../services/user.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Create User
 * ==========================================================
 */
const createUser = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const result = await createUserService(
            req.body,
            req.user
        );

        return successResponse(
            res,
            "User created successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("CREATE USER ERROR");
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
 * Get All Users
 * ==========================================================
 */
const getUsers = async (req, res) => {

    try {

        const users = await getUsersService(
            req.user,
            req.query
        );

        return successResponse(
            res,
            "Users fetched successfully.",
            users,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET USERS ERROR");
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
 * Get My Team (reportees + their tasks)
 * ==========================================================
 */
const getMyTeam = async (req, res) => {

    try {

        const team = await getMyTeamService(req.user);

        return successResponse(
            res,
            "Team fetched successfully.",
            team,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET MY TEAM ERROR");
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
 * Get User By ID
 * ==========================================================
 */
const getUserById = async (req, res) => {

    try {

        const { id } = req.params;

        const user = await getUserByIdService(
            id,
            req.user
        );

        return successResponse(
            res,
            "User fetched successfully.",
            user,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET USER BY ID ERROR");
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
 * Update User
 * ==========================================================
 */
const updateUser = async (req, res) => {

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

        const result = await updateUserService(
            id,
            req.body,
            req.user
        );

        return successResponse(
            res,
            "User updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE USER ERROR");
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
 * Delete User (Soft Delete)
 * ==========================================================
 */
const deleteUser = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await deleteUserService(
            id,
            req.user
        );

        return successResponse(
            res,
            "User deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE USER ERROR");
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
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getMyTeam,
};
