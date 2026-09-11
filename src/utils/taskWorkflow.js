const { isSystemAdmin } = require("./tenant");

const OVERRIDE_PERMISSION = "task.override_status";

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

/**
 * Forward / recovery paths for the current assignee.
 * Completed and Cancelled are terminal unless an override role reopens them.
 */
const STATUS_TRANSITIONS = {
    Backlog: ["Todo", "In Progress", "Cancelled"],
    Todo: ["Backlog", "In Progress", "On Hold", "Cancelled"],
    "In Progress": ["Todo", "On Hold", "Blocked", "In Review", "Completed", "Cancelled"],
    "On Hold": ["Todo", "In Progress", "Cancelled"],
    Blocked: ["In Progress", "On Hold", "Cancelled"],
    "In Review": ["In Progress", "Changes Requested", "Completed", "Cancelled"],
    "Changes Requested": ["In Progress", "In Review", "Cancelled"],
    Completed: [],
    Cancelled: [],
};

const hasNamedPermission = (user, permission) => {
    const permissions = user?.permissions || [];
    if (permissions.includes("*") && user?.userType !== "SYSTEM_ADMIN") return true;
    return permissions.includes(permission);
};

const canOverrideWorkflow = (user) => {
    if (!user) return false;
    if (isSystemAdmin(user)) return false;
    return hasNamedPermission(user, OVERRIDE_PERMISSION);
};

const isCurrentAssignee = (user, task) =>
    Number(task?.assigned_to) === Number(user?.id);

const canChangeTaskStatus = (user, task) => {
    if (canOverrideWorkflow(user)) return true;
    if (!hasNamedPermission(user, "task.change_status")) return false;
    return isCurrentAssignee(user, task);
};

const canAssignTask = (user, task) => {
    if (canOverrideWorkflow(user)) return true;
    if (hasNamedPermission(user, "task.assign")) return true;
    return isCurrentAssignee(user, task);
};

const allowedNextStatuses = (user, task) => {
    const current = task?.status;
    if (canOverrideWorkflow(user)) {
        return VALID_STATUSES.filter((status) => status !== current);
    }
    if (!canChangeTaskStatus(user, task)) return [];
    return (STATUS_TRANSITIONS[current] || []).filter((status) => status !== current);
};

const deny = (message, statusCode = 403) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
};

const assertCanChangeStatus = (user, task, nextStatus) => {
    if (!nextStatus || nextStatus === task.status) return;

    if (!VALID_STATUSES.includes(nextStatus)) {
        deny("Invalid status.", 400);
    }

    if (canOverrideWorkflow(user)) return;

    if (!isCurrentAssignee(user, task)) {
        deny(
            "Only the assigned user can change this task status. Complete the current stage first, or ask an admin to override."
        );
    }

    if (!hasNamedPermission(user, "task.change_status")) {
        deny("You do not have permission to change task status.");
    }

    const allowed = STATUS_TRANSITIONS[task.status] || [];
    if (!allowed.includes(nextStatus)) {
        deny(
            allowed.length
                ? `Cannot move from "${task.status}" to "${nextStatus}". Next allowed: ${allowed.join(", ")}.`
                : `"${task.status}" is a closed stage. An admin override is required to reopen it.`,
            400
        );
    }
};

const assertCanAssignTask = (user, task) => {
    if (canAssignTask(user, task)) return;
    deny("You cannot reassign this task. Only the assigned user or a user with assign permission can hand it off.");
};

const attachWorkflow = (task, user) => {
    if (!task) return task;
    return {
        ...task,
        workflow: {
            responsible_user_id: task.assigned_to || null,
            can_change_status: canChangeTaskStatus(user, task),
            can_assign: canAssignTask(user, task),
            can_override: canOverrideWorkflow(user),
            allowed_statuses: allowedNextStatuses(user, task),
        },
    };
};

module.exports = {
    OVERRIDE_PERMISSION,
    VALID_STATUSES,
    STATUS_TRANSITIONS,
    canOverrideWorkflow,
    isCurrentAssignee,
    canChangeTaskStatus,
    canAssignTask,
    allowedNextStatuses,
    assertCanChangeStatus,
    assertCanAssignTask,
    attachWorkflow,
};
