const express = require("express");

const router = express.Router();

const {
    body,
} = require("express-validator");

const {
    authenticate,
} = require("../middleware/auth.middleware");

const {
    requirePermission,
} = require("../middleware/permission.middleware");

const {
    upload,
    handleUploadError,
} = require("../middleware/upload.middleware");

const {
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
} = require("../controllers/task.controller");

const { VALID_STATUSES } = require("../services/task.service");


/**
 * ==========================================================
 * Get All Tasks
 * GET /api/v1/tasks
 * ==========================================================
 */
router.get(
    "/",
    authenticate,
    requirePermission("task.view"),
    getTasks
);


/**
 * ==========================================================
 * Create Task
 * POST /api/v1/tasks
 * ==========================================================
 */
router.post(
    "/",
    authenticate,
    requirePermission("task.create"),
    [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required.")
            .isLength({ min: 2, max: 255 })
            .withMessage("Title must be between 2 and 255 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim(),

        body("assigned_to")
            .notEmpty()
            .withMessage("assigned_to is required.")
            .isInt({ min: 1 })
            .withMessage("assigned_to must be a valid integer."),

        body("project_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("project_id must be a valid integer."),

        body("priority")
            .optional()
            .isIn(["Low", "Medium", "High", "Urgent"])
            .withMessage("Invalid priority."),

        body("status")
            .optional()
            .isIn(VALID_STATUSES)
            .withMessage("Invalid status."),

        body("start_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("Start date must be a valid date."),

        body("due_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("Due date must be a valid date."),

        body("estimated_hours")
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage("Estimated hours must be a positive number."),

        body("company_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("Company ID must be a valid integer."),
    ],
    createTask
);


/**
 * ==========================================================
 * Update Comment (own)
 * PUT /api/v1/tasks/comments/:commentId
 * ==========================================================
 */
router.put(
    "/comments/:commentId",
    authenticate,
    requirePermission("comment.edit_own"),
    [
        body("comment")
            .trim()
            .notEmpty()
            .withMessage("Comment is required.")
            .isLength({ min: 1, max: 5000 })
            .withMessage("Comment must be between 1 and 5000 characters."),
    ],
    updateComment
);


/**
 * ==========================================================
 * Delete Comment (own)
 * DELETE /api/v1/tasks/comments/:commentId
 * ==========================================================
 */
router.delete(
    "/comments/:commentId",
    authenticate,
    requirePermission("comment.delete_own"),
    deleteComment
);


/**
 * ==========================================================
 * Delete Attachment
 * DELETE /api/v1/tasks/attachments/:attachmentId
 * ==========================================================
 */
router.delete(
    "/attachments/:attachmentId",
    authenticate,
    requirePermission("attachment.delete"),
    deleteAttachment
);


/**
 * ==========================================================
 * Assign Task
 * POST /api/v1/tasks/:id/assign
 * ==========================================================
 */
router.post(
    "/:id/assign",
    authenticate,
    requirePermission("task.assign"),
    [
        body("assigned_to")
            .notEmpty()
            .withMessage("assigned_to is required.")
            .isInt({ min: 1 })
            .withMessage("assigned_to must be a valid integer."),
    ],
    assignTask
);


/**
 * ==========================================================
 * Change Task Status
 * PUT /api/v1/tasks/:id/status
 * ==========================================================
 */
router.put(
    "/:id/status",
    authenticate,
    requirePermission("task.change_status", "task.view"),
    [
        body("status")
            .notEmpty()
            .withMessage("Status is required.")
            .isIn(VALID_STATUSES)
            .withMessage("Invalid status."),
    ],
    changeTaskStatus
);


/**
 * ==========================================================
 * Change Task Priority
 * PUT /api/v1/tasks/:id/priority
 * ==========================================================
 */
router.put(
    "/:id/priority",
    authenticate,
    requirePermission("task.change_priority"),
    [
        body("priority")
            .notEmpty()
            .withMessage("Priority is required.")
            .isIn(["Low", "Medium", "High", "Urgent"])
            .withMessage("Invalid priority."),
    ],
    changeTaskPriority
);


/**
 * ==========================================================
 * Get Task Comments
 * GET /api/v1/tasks/:id/comments
 * ==========================================================
 */
router.get(
    "/:id/comments",
    authenticate,
    requirePermission("comment.view", "task.view"),
    getComments
);


/**
 * ==========================================================
 * Add Task Comment
 * POST /api/v1/tasks/:id/comments
 * ==========================================================
 */
router.post(
    "/:id/comments",
    authenticate,
    requirePermission("comment.create"),
    [
        body("comment")
            .trim()
            .notEmpty()
            .withMessage("Comment is required.")
            .isLength({ min: 1, max: 5000 })
            .withMessage("Comment must be between 1 and 5000 characters."),
    ],
    addComment
);


/**
 * ==========================================================
 * Update Comment (nested)
 * PUT /api/v1/tasks/:id/comments/:commentId
 * ==========================================================
 */
router.put(
    "/:id/comments/:commentId",
    authenticate,
    requirePermission("comment.edit_own"),
    [
        body("comment")
            .trim()
            .notEmpty()
            .withMessage("Comment is required.")
            .isLength({ min: 1, max: 5000 })
            .withMessage("Comment must be between 1 and 5000 characters."),
    ],
    updateComment
);


/**
 * ==========================================================
 * Delete Comment (nested)
 * DELETE /api/v1/tasks/:id/comments/:commentId
 * ==========================================================
 */
router.delete(
    "/:id/comments/:commentId",
    authenticate,
    requirePermission("comment.delete_own"),
    deleteComment
);


/**
 * ==========================================================
 * Get Task Attachments
 * GET /api/v1/tasks/:id/attachments
 * ==========================================================
 */
router.get(
    "/:id/attachments",
    authenticate,
    requirePermission("attachment.view", "task.view"),
    getAttachments
);


/**
 * ==========================================================
 * Upload Task Attachment
 * POST /api/v1/tasks/:id/attachments
 * ==========================================================
 */
router.post(
    "/:id/attachments",
    authenticate,
    requirePermission("attachment.upload"),
    upload.single("file"),
    handleUploadError,
    addAttachment
);


/**
 * ==========================================================
 * Delete Attachment (nested)
 * DELETE /api/v1/tasks/:id/attachments/:attachmentId
 * ==========================================================
 */
router.delete(
    "/:id/attachments/:attachmentId",
    authenticate,
    requirePermission("attachment.delete"),
    deleteAttachment
);


/**
 * ==========================================================
 * Get Task History
 * GET /api/v1/tasks/:id/history
 * ==========================================================
 */
router.get(
    "/:id/history",
    authenticate,
    requirePermission("task.view"),
    getTaskHistory
);


/**
 * ==========================================================
 * Get Task By ID
 * GET /api/v1/tasks/:id
 * ==========================================================
 */
router.get(
    "/:id",
    authenticate,
    requirePermission("task.view"),
    getTaskById
);


/**
 * ==========================================================
 * Update Task
 * PUT /api/v1/tasks/:id
 * ==========================================================
 */
router.put(
    "/:id",
    authenticate,
    requirePermission("task.update"),
    [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty.")
            .isLength({ min: 2, max: 255 })
            .withMessage("Title must be between 2 and 255 characters."),

        body("description")
            .optional({ checkFalsy: true })
            .trim(),

        body("project_id")
            .optional({ checkFalsy: true })
            .isInt({ min: 1 })
            .withMessage("project_id must be a valid integer."),

        body("priority")
            .optional()
            .isIn(["Low", "Medium", "High", "Urgent"])
            .withMessage("Invalid priority."),

        body("status")
            .optional()
            .isIn(VALID_STATUSES)
            .withMessage("Invalid status."),

        body("start_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("Start date must be a valid date."),

        body("due_date")
            .optional({ checkFalsy: true })
            .isISO8601()
            .withMessage("Due date must be a valid date."),

        body("estimated_hours")
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage("Estimated hours must be a positive number."),

        body("actual_hours")
            .optional({ checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage("Actual hours must be a positive number."),
    ],
    updateTask
);


/**
 * ==========================================================
 * Delete Task
 * DELETE /api/v1/tasks/:id
 * ==========================================================
 */
router.delete(
    "/:id",
    authenticate,
    requirePermission("task.delete"),
    deleteTask
);


module.exports = router;
