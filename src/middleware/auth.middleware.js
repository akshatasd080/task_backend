const { verifyToken } = require("../config/jwt");
const { errorResponse } = require("../utils/response");
const { getPermissionsByRoleId } = require("../utils/helpers");
const pool = require("../config/db");

/**
 * JWT Authentication Middleware
 * Attaches req.user with id, email, companyId, roleId, userType, roleName, permissions
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return errorResponse(res, "Authorization header is missing.", 401);
        }

        if (!authHeader.startsWith("Bearer ")) {
            return errorResponse(
                res,
                "Authorization header must be: Bearer <token>",
                401
            );
        }

        const token = authHeader.replace("Bearer ", "").trim();

        if (!token) {
            return errorResponse(res, "Access token is required.", 401);
        }

        const decoded = verifyToken(token);

        req.user = {
            id: decoded.id,
            email: decoded.email,
            companyId: decoded.companyId || null,
            roleId: decoded.roleId || null,
            userType: decoded.userType,
            roleName: null,
            permissions: [],
        };

        if (decoded.userType === "SYSTEM_ADMIN") {
            req.user.roleName = "Super Admin";
            req.user.permissions = ["*"];
            return next();
        }

        if (decoded.roleId) {
            const roleResult = await pool.query(
                `
                SELECT role_name
                FROM task_management.roles
                WHERE id = $1
                  AND deleted_at IS NULL
                `,
                [decoded.roleId]
            );

            if (roleResult.rows.length > 0) {
                req.user.roleName = roleResult.rows[0].role_name;
            }

            req.user.permissions = await getPermissionsByRoleId(decoded.roleId);
        }

        return next();
    } catch (error) {
        return errorResponse(res, "Invalid or expired token.", 401);
    }
};

/**
 * Role Authorization Middleware (legacy userType checks)
 * Prefer requirePermission for new routes.
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return errorResponse(res, "Unauthorized access.", 401);
            }

            if (!roles.includes(req.user.userType)) {
                return errorResponse(
                    res,
                    "You do not have permission to access this resource.",
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
    authenticate,
    authorize,
};
