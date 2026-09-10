const pool = require("../config/db");
const path = require("path");
const { isSystemAdmin } = require("../utils/tenant");
const { logActivity, createNotification, teamTaskAccessSql } = require("../utils/helpers");

const VALID_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const VALID_STATUSES = [
    "Backlog",
    "Todo",
    "In Progress",
    "On Hold",
    "Blocked",
    "In Review",
    "Changes Requested",
    "Completed",
    "Cancelled",
];

const ensureCompanyAccess = (user, companyId) => {
    if (isSystemAdmin(user)) return;
    if (Number(user.companyId) !== Number(companyId)) {
        const err = new Error("You do not have permission to access this resource.");
        err.statusCode = 403;
        throw err;
    }
};

const hasPermission = (user, permission) => {
    if (isSystemAdmin(user)) return true;
    return (user.permissions || []).includes(permission);
};

const canViewTask = (user, task) => {
    if (isSystemAdmin(user)) return true;
    if (Number(task.company_id) !== Number(user.companyId)) return false;
    if (hasPermission(user, "view_all_company_tasks")) return true;
    return (
        Number(task.assigned_to) === Number(user.id) ||
        Number(task.created_by) === Number(user.id) ||
        Number(task.assigned_by) === Number(user.id) ||
        Number(task.assigned_to_manager_id) === Number(user.id)
    );
};

const getTaskRow = async (taskId) => {
    const result = await pool.query(
        `
        SELECT
            t.*,
            p.project_name,
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            assignee.first_name AS assigned_to_first_name,
            assignee.last_name AS assigned_to_last_name,
            assignee.email AS assigned_to_email,
            assignee.manager_id AS assigned_to_manager_id,
            assigner.first_name AS assigned_by_first_name,
            assigner.last_name AS assigned_by_last_name
        FROM task_management.tasks t
        LEFT JOIN task_management.projects p ON p.id = t.project_id
        LEFT JOIN task_management.users creator ON creator.id = t.created_by
        LEFT JOIN task_management.users assignee ON assignee.id = t.assigned_to
        LEFT JOIN task_management.users assigner ON assigner.id = t.assigned_by
        WHERE t.id = $1 AND t.is_active = TRUE
        `,
        [taskId]
    );

    if (result.rows.length === 0) {
        throw Object.assign(new Error("Task not found."), { statusCode: 404 });
    }

    return result.rows[0];
};

const createTaskService = async (data, loggedInUser) => {
    const companyId = isSystemAdmin(loggedInUser)
        ? Number(data.company_id)
        : Number(loggedInUser.companyId);

    if (!companyId) {
        throw Object.assign(new Error("Company is required."), { statusCode: 400 });
    }

    ensureCompanyAccess(loggedInUser, companyId);

    const {
        title,
        description,
        project_id,
        assigned_to,
        priority = "Medium",
        status = "Backlog",
        start_date,
        due_date,
        estimated_hours,
    } = data;

    if (!VALID_PRIORITIES.includes(priority)) {
        throw Object.assign(new Error("Invalid priority."), { statusCode: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error("Invalid status."), { statusCode: 400 });
    }

    if (!assigned_to) {
        throw Object.assign(new Error("assigned_to is required."), { statusCode: 400 });
    }

    const assigneeCheck = await pool.query(
        `
        SELECT id FROM task_management.users
        WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL AND is_active = TRUE
        `,
        [assigned_to, companyId]
    );

    if (assigneeCheck.rows.length === 0) {
        throw Object.assign(new Error("Assignee must belong to the same company."), {
            statusCode: 400,
        });
    }

    if (project_id) {
        const projectCheck = await pool.query(
            `
            SELECT id FROM task_management.projects
            WHERE id = $1 AND company_id = $2 AND is_active = TRUE
            `,
            [project_id, companyId]
        );
        if (projectCheck.rows.length === 0) {
            throw Object.assign(new Error("Project not found in this company."), {
                statusCode: 400,
            });
        }
    }

    const result = await pool.query(
        `
        INSERT INTO task_management.tasks
        (
            company_id, project_id, assigned_by, assigned_to, created_by,
            title, description, priority, status,
            start_date, due_date, estimated_hours
        )
        VALUES ($1,$2,$3,$4,$3,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *
        `,
        [
            companyId,
            project_id || null,
            loggedInUser.id,
            assigned_to,
            title,
            description || null,
            priority,
            status,
            start_date || null,
            due_date || null,
            estimated_hours || null,
        ]
    );

    const task = result.rows[0];

    await logActivity({
        companyId,
        userId: loggedInUser.id,
        moduleName: "task",
        action: "created",
        referenceId: task.id,
        description: `Task "${title}" created`,
        newValue: title,
    });

    if (Number(assigned_to) !== Number(loggedInUser.id)) {
        await createNotification({
            companyId,
            userId: assigned_to,
            title: "New task assigned",
            message: `You have been assigned task: ${title}`,
            type: "task_assigned",
            relatedTaskId: task.id,
        });

        await logActivity({
            companyId,
            userId: loggedInUser.id,
            moduleName: "task",
            action: "assigned",
            referenceId: task.id,
            description: `Task assigned`,
            newValue: String(assigned_to),
        });
    }

    return getTaskByIdService(task.id, loggedInUser);
};

const getTasksService = async (loggedInUser, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    const params = [];
    const filters = ["t.is_active = TRUE"];

    if (!isSystemAdmin(loggedInUser)) {
        params.push(loggedInUser.companyId);
        filters.push(`t.company_id = $${params.length}`);

        if (!hasPermission(loggedInUser, "view_all_company_tasks")) {
            params.push(loggedInUser.id);
            filters.push(teamTaskAccessSql(`$${params.length}`));
        }
    } else if (query.company_id) {
        params.push(Number(query.company_id));
        filters.push(`t.company_id = $${params.length}`);
    }

    if (query.status) {
        params.push(query.status);
        filters.push(`t.status = $${params.length}`);
    }

    if (query.priority) {
        params.push(query.priority);
        filters.push(`t.priority = $${params.length}`);
    }

    if (query.project_id) {
        params.push(Number(query.project_id));
        filters.push(`t.project_id = $${params.length}`);
    }

    if (query.assigned_to) {
        params.push(Number(query.assigned_to));
        filters.push(`t.assigned_to = $${params.length}`);
    }

    if (query.due_before) {
        params.push(query.due_before);
        filters.push(`t.due_date <= $${params.length}`);
    }

    if (query.due_after) {
        params.push(query.due_after);
        filters.push(`t.due_date >= $${params.length}`);
    }

    if (query.overdue === "true") {
        filters.push(`t.due_date < CURRENT_DATE AND t.status NOT IN ('Completed', 'Cancelled')`);
    }

    if (query.search) {
        params.push(`%${query.search}%`);
        filters.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }

    const sortMap = {
        due_date: "t.due_date",
        priority: "t.priority",
        status: "t.status",
        created_at: "t.created_at",
        title: "t.title",
    };
    const sortBy = sortMap[query.sort_by] || "t.created_at";
    const sortOrder = query.sort_order === "asc" ? "ASC" : "DESC";

    const where = `WHERE ${filters.join(" AND ")}`;

    const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM task_management.tasks t ${where}`,
        params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
        `
        SELECT
            t.*,
            p.project_name,
            creator.first_name AS created_by_first_name,
            creator.last_name AS created_by_last_name,
            assignee.first_name AS assigned_to_first_name,
            assignee.last_name AS assigned_to_last_name
        FROM task_management.tasks t
        LEFT JOIN task_management.projects p ON p.id = t.project_id
        LEFT JOIN task_management.users creator ON creator.id = t.created_by
        LEFT JOIN task_management.users assignee ON assignee.id = t.assigned_to
        ${where}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${params.length - 1} OFFSET $${params.length}
        `,
        params
    );

    return {
        items: result.rows,
        pagination: {
            page,
            limit,
            total: countResult.rows[0].total,
            totalPages: Math.ceil(countResult.rows[0].total / limit) || 1,
        },
    };
};

const getTaskByIdService = async (taskId, loggedInUser) => {
    const task = await getTaskRow(taskId);

    if (!canViewTask(loggedInUser, task)) {
        throw Object.assign(new Error("You do not have permission to access this resource."), {
            statusCode: 403,
        });
    }

    return task;
};

const updateTaskService = async (taskId, data, loggedInUser) => {
    const existing = await getTaskByIdService(taskId, loggedInUser);

    if (
        !hasPermission(loggedInUser, "task.update") &&
        !isSystemAdmin(loggedInUser)
    ) {
        throw Object.assign(new Error("You do not have permission to perform this action."), {
            statusCode: 403,
        });
    }

    const {
        title,
        description,
        project_id,
        priority,
        status,
        start_date,
        due_date,
        estimated_hours,
        actual_hours,
    } = data;

    if (priority && !VALID_PRIORITIES.includes(priority)) {
        throw Object.assign(new Error("Invalid priority."), { statusCode: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error("Invalid status."), { statusCode: 400 });
    }

    const completedAt =
        status === "Completed"
            ? new Date()
            : status && status !== "Completed"
              ? null
              : undefined;

    const result = await pool.query(
        `
        UPDATE task_management.tasks
        SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            project_id = COALESCE($3, project_id),
            priority = COALESCE($4, priority),
            status = COALESCE($5, status),
            start_date = COALESCE($6, start_date),
            due_date = COALESCE($7, due_date),
            estimated_hours = COALESCE($8, estimated_hours),
            actual_hours = COALESCE($9, actual_hours),
            completed_at = CASE
                WHEN $10::boolean THEN CURRENT_TIMESTAMP
                WHEN $11::boolean THEN NULL
                ELSE completed_at
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *
        `,
        [
            title ?? null,
            description ?? null,
            project_id === undefined ? null : project_id,
            priority ?? null,
            status ?? null,
            start_date ?? null,
            due_date ?? null,
            estimated_hours ?? null,
            actual_hours ?? null,
            status === "Completed",
            Boolean(status && status !== "Completed"),
            taskId,
        ]
    );

    const updated = result.rows[0];

    const trackFields = [
        ["title", existing.title, updated.title],
        ["priority", existing.priority, updated.priority],
        ["status", existing.status, updated.status],
        ["due_date", existing.due_date, updated.due_date],
        ["start_date", existing.start_date, updated.start_date],
    ];

    for (const [field, oldVal, newVal] of trackFields) {
        if (String(oldVal ?? "") !== String(newVal ?? "")) {
            await logActivity({
                companyId: existing.company_id,
                userId: loggedInUser.id,
                moduleName: "task",
                action: `${field}_changed`,
                referenceId: taskId,
                description: `${field} changed`,
                oldValue: oldVal,
                newValue: newVal,
            });
        }
    }

    if (status && status !== existing.status && Number(existing.assigned_to) !== Number(loggedInUser.id)) {
        await createNotification({
            companyId: existing.company_id,
            userId: existing.assigned_to,
            title: "Task status updated",
            message: `Task "${updated.title}" status changed to ${status}`,
            type: "status_changed",
            relatedTaskId: taskId,
        });
    }

    return getTaskByIdService(taskId, loggedInUser);
};

const deleteTaskService = async (taskId, loggedInUser) => {
    const existing = await getTaskByIdService(taskId, loggedInUser);

    if (!hasPermission(loggedInUser, "task.delete") && !isSystemAdmin(loggedInUser)) {
        throw Object.assign(new Error("You do not have permission to perform this action."), {
            statusCode: 403,
        });
    }

    const result = await pool.query(
        `
        UPDATE task_management.tasks
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, title, is_active
        `,
        [taskId]
    );

    await logActivity({
        companyId: existing.company_id,
        userId: loggedInUser.id,
        moduleName: "task",
        action: "deleted",
        referenceId: taskId,
        description: `Task "${existing.title}" deleted`,
    });

    return result.rows[0];
};

const assignTaskService = async (taskId, assignedTo, loggedInUser) => {
    const existing = await getTaskByIdService(taskId, loggedInUser);

    const assigneeCheck = await pool.query(
        `
        SELECT id FROM task_management.users
        WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL AND is_active = TRUE
        `,
        [assignedTo, existing.company_id]
    );

    if (assigneeCheck.rows.length === 0) {
        throw Object.assign(new Error("Assignee must belong to the same company."), {
            statusCode: 400,
        });
    }

    const oldAssignee = existing.assigned_to;

    await pool.query(
        `
        UPDATE task_management.tasks
        SET assigned_to = $1, assigned_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [assignedTo, loggedInUser.id, taskId]
    );

    await logActivity({
        companyId: existing.company_id,
        userId: loggedInUser.id,
        moduleName: "task",
        action: oldAssignee ? "reassigned" : "assigned",
        referenceId: taskId,
        description: oldAssignee ? "Task reassigned" : "Task assigned",
        oldValue: String(oldAssignee),
        newValue: String(assignedTo),
    });

    await createNotification({
        companyId: existing.company_id,
        userId: assignedTo,
        title: oldAssignee ? "Task reassigned to you" : "New task assigned",
        message: `Task "${existing.title}" has been assigned to you`,
        type: oldAssignee ? "task_reassigned" : "task_assigned",
        relatedTaskId: taskId,
    });

    return getTaskByIdService(taskId, loggedInUser);
};

const changeStatusService = async (taskId, status, loggedInUser) => {
    if (!VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error("Invalid status."), { statusCode: 400 });
    }

    const existing = await getTaskByIdService(taskId, loggedInUser);
    const isManagerOfAssignee =
        Number(existing.assigned_to_manager_id) === Number(loggedInUser.id);

    if (
        !hasPermission(loggedInUser, "task.change_status") &&
        !isSystemAdmin(loggedInUser) &&
        !isManagerOfAssignee
    ) {
        throw Object.assign(new Error("You do not have permission to perform this action."), {
            statusCode: 403,
        });
    }

    // Employees can change status on tasks they can view (assigned/created)
    await pool.query(
        `
        UPDATE task_management.tasks
        SET
            status = $1,
            completed_at = CASE WHEN $1 = 'Completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [status, taskId]
    );

    await logActivity({
        companyId: existing.company_id,
        userId: loggedInUser.id,
        moduleName: "task",
        action: "status_changed",
        referenceId: taskId,
        description: "Status changed",
        oldValue: existing.status,
        newValue: status,
    });

    if (Number(existing.assigned_to) !== Number(loggedInUser.id)) {
        await createNotification({
            companyId: existing.company_id,
            userId: existing.assigned_to,
            title: "Task status updated",
            message: `Task "${existing.title}" status changed to ${status}`,
            type: "status_changed",
            relatedTaskId: taskId,
        });
    }

    if (
        existing.assigned_to_manager_id &&
        Number(existing.assigned_to_manager_id) !== Number(loggedInUser.id) &&
        Number(existing.assigned_to_manager_id) !== Number(existing.assigned_to)
    ) {
        await createNotification({
            companyId: existing.company_id,
            userId: existing.assigned_to_manager_id,
            title: "Team member task update",
            message: `Task "${existing.title}" for ${existing.assigned_to_first_name || "a team member"} is now ${status}`,
            type: "status_changed",
            relatedTaskId: taskId,
        });
    }

    if (status === "Completed" && existing.created_by) {
        await createNotification({
            companyId: existing.company_id,
            userId: existing.created_by,
            title: "Task completed",
            message: `Task "${existing.title}" was marked completed`,
            type: "task_completed",
            relatedTaskId: taskId,
        });
    }

    return getTaskByIdService(taskId, loggedInUser);
};

const changePriorityService = async (taskId, priority, loggedInUser) => {
    if (!VALID_PRIORITIES.includes(priority)) {
        throw Object.assign(new Error("Invalid priority."), { statusCode: 400 });
    }

    if (
        !hasPermission(loggedInUser, "task.change_priority") &&
        !isSystemAdmin(loggedInUser)
    ) {
        throw Object.assign(new Error("You do not have permission to perform this action."), {
            statusCode: 403,
        });
    }

    const existing = await getTaskByIdService(taskId, loggedInUser);

    await pool.query(
        `
        UPDATE task_management.tasks
        SET priority = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [priority, taskId]
    );

    await logActivity({
        companyId: existing.company_id,
        userId: loggedInUser.id,
        moduleName: "task",
        action: "priority_changed",
        referenceId: taskId,
        description: "Priority changed",
        oldValue: existing.priority,
        newValue: priority,
    });

    return getTaskByIdService(taskId, loggedInUser);
};

const getCommentsService = async (taskId, loggedInUser) => {
    await getTaskByIdService(taskId, loggedInUser);

    const result = await pool.query(
        `
        SELECT
            c.*,
            u.first_name, u.last_name, u.email
        FROM task_management.task_comments c
        INNER JOIN task_management.users u ON u.id = c.user_id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC
        `,
        [taskId]
    );

    return result.rows;
};

const addCommentService = async (taskId, comment, loggedInUser) => {
    const task = await getTaskByIdService(taskId, loggedInUser);

    const result = await pool.query(
        `
        INSERT INTO task_management.task_comments
        (task_id, user_id, company_id, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [taskId, loggedInUser.id, task.company_id, comment]
    );

    await logActivity({
        companyId: task.company_id,
        userId: loggedInUser.id,
        moduleName: "task",
        action: "comment_added",
        referenceId: taskId,
        description: "Comment added",
        newValue: comment.substring(0, 200),
    });

    const notifyUserIds = new Set([task.assigned_to, task.created_by, task.assigned_by]);
    notifyUserIds.delete(Number(loggedInUser.id));

    for (const userId of notifyUserIds) {
        if (userId) {
            await createNotification({
                companyId: task.company_id,
                userId,
                title: "New comment on task",
                message: `A comment was added on "${task.title}"`,
                type: "comment_added",
                relatedTaskId: taskId,
            });
        }
    }

    return result.rows[0];
};

const updateCommentService = async (commentId, comment, loggedInUser) => {
    const existing = await pool.query(
        `SELECT * FROM task_management.task_comments WHERE id = $1`,
        [commentId]
    );

    if (existing.rows.length === 0) {
        throw Object.assign(new Error("Comment not found."), { statusCode: 404 });
    }

    const row = existing.rows[0];
    await getTaskByIdService(row.task_id, loggedInUser);

    if (
        Number(row.user_id) !== Number(loggedInUser.id) &&
        !isSystemAdmin(loggedInUser)
    ) {
        throw Object.assign(new Error("You can only edit your own comments."), {
            statusCode: 403,
        });
    }

    const result = await pool.query(
        `
        UPDATE task_management.task_comments
        SET comment = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [comment, commentId]
    );

    return result.rows[0];
};

const deleteCommentService = async (commentId, loggedInUser) => {
    const existing = await pool.query(
        `SELECT * FROM task_management.task_comments WHERE id = $1`,
        [commentId]
    );

    if (existing.rows.length === 0) {
        throw Object.assign(new Error("Comment not found."), { statusCode: 404 });
    }

    const row = existing.rows[0];
    await getTaskByIdService(row.task_id, loggedInUser);

    if (
        Number(row.user_id) !== Number(loggedInUser.id) &&
        !isSystemAdmin(loggedInUser)
    ) {
        throw Object.assign(new Error("You can only delete your own comments."), {
            statusCode: 403,
        });
    }

    await pool.query(`DELETE FROM task_management.task_comments WHERE id = $1`, [commentId]);
    return { id: commentId, deleted: true };
};

const getAttachmentsService = async (taskId, loggedInUser) => {
    await getTaskByIdService(taskId, loggedInUser);

    const result = await pool.query(
        `
        SELECT
            a.*,
            u.first_name AS uploaded_by_first_name,
            u.last_name AS uploaded_by_last_name
        FROM task_management.task_attachments a
        LEFT JOIN task_management.users u ON u.id = a.uploaded_by
        WHERE a.task_id = $1
        ORDER BY a.created_at DESC
        `,
        [taskId]
    );

    return result.rows;
};

const addAttachmentService = async (taskId, file, loggedInUser) => {
    const task = await getTaskByIdService(taskId, loggedInUser);

    if (!file) {
        throw Object.assign(new Error("File is required."), { statusCode: 400 });
    }

    const relativePath = path
        .join("uploads", String(task.company_id), file.filename)
        .replace(/\\/g, "/");

    const result = await pool.query(
        `
        INSERT INTO task_management.task_attachments
        (task_id, company_id, uploaded_by, file_name, file_path, file_size, file_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            taskId,
            task.company_id,
            loggedInUser.id,
            file.originalname,
            relativePath,
            file.size,
            file.mimetype,
        ]
    );

    await logActivity({
        companyId: task.company_id,
        userId: loggedInUser.id,
        moduleName: "task",
        action: "attachment_uploaded",
        referenceId: taskId,
        description: `Attachment uploaded: ${file.originalname}`,
        newValue: file.originalname,
    });

    return result.rows[0];
};

const deleteAttachmentService = async (attachmentId, loggedInUser) => {
    const existing = await pool.query(
        `SELECT * FROM task_management.task_attachments WHERE id = $1`,
        [attachmentId]
    );

    if (existing.rows.length === 0) {
        throw Object.assign(new Error("Attachment not found."), { statusCode: 404 });
    }

    const row = existing.rows[0];
    await getTaskByIdService(row.task_id, loggedInUser);

    await pool.query(`DELETE FROM task_management.task_attachments WHERE id = $1`, [
        attachmentId,
    ]);

    return { id: attachmentId, deleted: true };
};

const getTaskHistoryService = async (taskId, loggedInUser) => {
    const task = await getTaskByIdService(taskId, loggedInUser);

    const result = await pool.query(
        `
        SELECT
            a.id, a.action, a.description, a.old_value, a.new_value,
            a.created_at AS timestamp,
            a.user_id AS performed_by,
            u.first_name, u.last_name
        FROM task_management.activity_logs a
        LEFT JOIN task_management.users u ON u.id = a.user_id
        WHERE a.module_name = 'task'
          AND a.reference_id = $1
          AND a.company_id = $2
        ORDER BY a.created_at DESC
        `,
        [taskId, task.company_id]
    );

    return result.rows;
};

module.exports = {
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
    VALID_PRIORITIES,
    VALID_STATUSES,
};
