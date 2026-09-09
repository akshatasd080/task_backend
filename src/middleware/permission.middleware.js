const { errorResponse } = require("../utils/response");
const { isSystemAdmin } = require("../utils/tenant");
const { SUPER_ADMIN_PERMISSIONS } = require("../utils/companyOnboard");

/**
 * Require one or more permissions.
 * SYSTEM_ADMIN only has company.* permissions (no task/user CRM work).
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return errorResponse(res, "Unauthorized access.", 401);
            }

            let userPermissions = req.user.permissions || [];

            if (isSystemAdmin(req.user)) {
                userPermissions = SUPER_ADMIN_PERMISSIONS;
            }

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

const requireAllPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return errorResponse(res, "Unauthorized access.", 401);
            }

            let userPermissions = req.user.permissions || [];

            if (isSystemAdmin(req.user)) {
                userPermissions = SUPER_ADMIN_PERMISSIONS;
            }

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
