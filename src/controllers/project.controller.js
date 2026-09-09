const { validationResult } = require("express-validator");

const {
    createProjectService,
    getProjectsService,
    getProjectByIdService,
    updateProjectService,
    deleteProjectService,
} = require("../services/project.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Create Project
 * ==========================================================
 */
const createProject = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const result = await createProjectService(
            req.body,
            req.user
        );

        return successResponse(
            res,
            "Project created successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("CREATE PROJECT ERROR");
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
 * Get All Projects
 * ==========================================================
 */
const getProjects = async (req, res) => {

    try {

        const projects = await getProjectsService(
            req.user,
            req.query
        );

        return successResponse(
            res,
            "Projects fetched successfully.",
            projects,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET PROJECTS ERROR");
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
 * Get Project By ID
 * ==========================================================
 */
const getProjectById = async (req, res) => {

    try {

        const { id } = req.params;

        const project = await getProjectByIdService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Project fetched successfully.",
            project,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET PROJECT BY ID ERROR");
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
 * Update Project
 * ==========================================================
 */
const updateProject = async (req, res) => {

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

        const result = await updateProjectService(
            id,
            req.body,
            req.user
        );

        return successResponse(
            res,
            "Project updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE PROJECT ERROR");
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
 * Delete Project (Soft Delete)
 * ==========================================================
 */
const deleteProject = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await deleteProjectService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Project deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE PROJECT ERROR");
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
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
};
