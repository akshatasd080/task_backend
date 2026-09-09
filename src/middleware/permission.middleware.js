const { errorResponse } = require("../utils/response");
const { isSystemAdmin } = require("../utils/tenant");

/**
 * Require one or more permissions.
 * SYSTEM_ADMIN bypasses permission checks.
 * Usage: requirePermission("task.create")
 *        requirePermission("task.view", "view_all_company_tasks")
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return errorResponse(res, "Unauthorized access.", 401);
            }

            if (isSystemAdmin(req.user)) {
                return next();
            }

            const userPermissions = req.user.permissions || [];

            const hasPermission = requiredPermissions.some((perm) =>
                userPermissions.includes(perm)
            );

            if (!hasPermission) {
                return errorResponse(
                    res,
                    "You do not have permission to perform this action.",
                    403
                );
            }

            return next();
        } catch (error) {
            return errorResponse(res, "Authorization failed.", 403);
        }
    };
};

/**
 * Require ALL listed permissions.
 */
const requireAllPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return errorResponse(res, "Unauthorized access.", 401);
            }

            if (isSystemAdmin(req.user)) {
                return next();
            }

            const userPermissions = req.user.permissions || [];
            const hasAll = requiredPermissions.every((perm) =>
                userPermissions.includes(perm)
            );

            if (!hasAll) {
                return errorResponse(
                    res,
                    "You do not have permission to perform this action.",
                    403
                );
            }

            return next();
        } catch (error) {
            return errorResponse(res, "Authorization failed.", 403);
        }
    };
};

module.exports = {
    requirePermission,
    requireAllPermissions,
};
