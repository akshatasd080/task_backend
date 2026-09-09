const { validationResult } = require("express-validator");

const {
    createTaskService,
    getTasksService,
    getTaskByIdService,
    updateTaskService,
    deleteTaskService,
    assignTaskService,
    changeStatusService,
    changePriorityService,
    getCommentsService,
    addCommentService,
    updateCommentService,
    deleteCommentService,
    getAttachmentsService,
    addAttachmentService,
    deleteAttachmentService,
    getTaskHistoryService,
} = require("../services/task.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");


/**
 * ==========================================================
 * Create Task
 * ==========================================================
 */
const createTask = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const result = await createTaskService(
            req.body,
            req.user
        );

        return successResponse(
            res,
            "Task created successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("CREATE TASK ERROR");
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
 * Get All Tasks
 * ==========================================================
 */
const getTasks = async (req, res) => {

    try {

        const tasks = await getTasksService(
            req.user,
            req.query
        );

        return successResponse(
            res,
            "Tasks fetched successfully.",
            tasks,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET TASKS ERROR");
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
 * Get Task By ID
 * ==========================================================
 */
const getTaskById = async (req, res) => {

    try {

        const { id } = req.params;

        const task = await getTaskByIdService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Task fetched successfully.",
            task,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET TASK BY ID ERROR");
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
 * Update Task
 * ==========================================================
 */
const updateTask = async (req, res) => {

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

        const result = await updateTaskService(
            id,
            req.body,
            req.user
        );

        return successResponse(
            res,
            "Task updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE TASK ERROR");
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
 * Delete Task (Soft Delete)
 * ==========================================================
 */
const deleteTask = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await deleteTaskService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Task deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE TASK ERROR");
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
 * Assign Task
 * ==========================================================
 */
const assignTask = async (req, res) => {

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
        const { assigned_to } = req.body;

        const result = await assignTaskService(
            id,
            assigned_to,
            req.user
        );

        return successResponse(
            res,
            "Task assigned successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("ASSIGN TASK ERROR");
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
 * Change Task Status
 * ==========================================================
 */
const changeTaskStatus = async (req, res) => {

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
        const { status } = req.body;

        const result = await changeStatusService(
            id,
            status,
            req.user
        );

        return successResponse(
            res,
            "Task status updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("CHANGE TASK STATUS ERROR");
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
 * Change Task Priority
 * ==========================================================
 */
const changeTaskPriority = async (req, res) => {

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
        const { priority } = req.body;

        const result = await changePriorityService(
            id,
            priority,
            req.user
        );

        return successResponse(
            res,
            "Task priority updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("CHANGE TASK PRIORITY ERROR");
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
 * Get Task Comments
 * ==========================================================
 */
const getComments = async (req, res) => {

    try {

        const { id } = req.params;

        const comments = await getCommentsService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Comments fetched successfully.",
            comments,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET COMMENTS ERROR");
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
 * Add Task Comment
 * ==========================================================
 */
const addComment = async (req, res) => {

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
        const { comment } = req.body;

        const result = await addCommentService(
            id,
            comment,
            req.user
        );

        return successResponse(
            res,
            "Comment added successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("ADD COMMENT ERROR");
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
 * Update Comment
 * ==========================================================
 */
const updateComment = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            return errorResponse(
                res,
                errors.array()[0].msg,
                400
            );

        }

        const { commentId } = req.params;
        const { comment } = req.body;

        const result = await updateCommentService(
            commentId,
            comment,
            req.user
        );

        return successResponse(
            res,
            "Comment updated successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("UPDATE COMMENT ERROR");
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
 * Delete Comment
 * ==========================================================
 */
const deleteComment = async (req, res) => {

    try {

        const { commentId } = req.params;

        const result = await deleteCommentService(
            commentId,
            req.user
        );

        return successResponse(
            res,
            "Comment deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE COMMENT ERROR");
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
 * Get Task Attachments
 * ==========================================================
 */
const getAttachments = async (req, res) => {

    try {

        const { id } = req.params;

        const attachments = await getAttachmentsService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Attachments fetched successfully.",
            attachments,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET ATTACHMENTS ERROR");
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
 * Add Task Attachment
 * ==========================================================
 */
const addAttachment = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await addAttachmentService(
            id,
            req.file,
            req.user
        );

        return successResponse(
            res,
            "Attachment uploaded successfully.",
            result,
            201
        );

    } catch (error) {

        console.error("====================================");
        console.error("ADD ATTACHMENT ERROR");
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
 * Delete Attachment
 * ==========================================================
 */
const deleteAttachment = async (req, res) => {

    try {

        const { attachmentId } = req.params;

        const result = await deleteAttachmentService(
            attachmentId,
            req.user
        );

        return successResponse(
            res,
            "Attachment deleted successfully.",
            result,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("DELETE ATTACHMENT ERROR");
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
 * Get Task History
 * ==========================================================
 */
const getTaskHistory = async (req, res) => {

    try {

        const { id } = req.params;

        const history = await getTaskHistoryService(
            id,
            req.user
        );

        return successResponse(
            res,
            "Task history fetched successfully.",
            history,
            200
        );

    } catch (error) {

        console.error("====================================");
        console.error("GET TASK HISTORY ERROR");
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
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    changeTaskStatus,
    changeTaskPriority,
    getComments,
    addComment,
    updateComment,
    deleteComment,
    getAttachments,
    addAttachment,
    deleteAttachment,
    getTaskHistory,
};
