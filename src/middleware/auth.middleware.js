const { verifyToken } = require("../config/jwt");
const { errorResponse } = require("../utils/response");

/**
 * ==========================================================
 * JWT Authentication Middleware
 * ==========================================================
 */
const authenticate = (req, res, next) => {

    try {

        console.log("\n==========================================");
        console.log("🔐 AUTHENTICATION MIDDLEWARE");
        console.log("==========================================");

        // Get Authorization Header
        const authHeader = req.headers.authorization;

        console.log("Authorization Header:", authHeader);

        if (!authHeader) {

            return errorResponse(
                res,
                "Authorization header is missing.",
                401
            );

        }

        // Check Bearer Format
        if (!authHeader.startsWith("Bearer ")) {

            return errorResponse(
                res,
                "Authorization header must be: Bearer <token>",
                401
            );

        }

        // Extract Token
        const token = authHeader.replace("Bearer ", "").trim();

        console.log("Received Token:");
        console.log(token);

        if (!token) {

            return errorResponse(
                res,
                "Access token is required.",
                401
            );

        }

        // Verify Token
        const decoded = verifyToken(token);

        console.log("\n✅ TOKEN VERIFIED SUCCESSFULLY");
        console.log(decoded);

        // Store user in request
        req.user = decoded;

        next();

    } catch (error) {

        console.log("\n==========================================");
        console.log("❌ JWT VERIFICATION FAILED");
        console.log("==========================================");
        console.log("Error Name :", error.name);
        console.log("Error Message :", error.message);
        console.log("Stack :", error.stack);
        console.log("==========================================\n");

        return errorResponse(
            res,
            "Invalid or expired token.",
            401
        );

    }

};


/**
 * ==========================================================
 * Role Authorization Middleware
 * ==========================================================
 */
const authorize = (...roles) => {

    return (req, res, next) => {

        try {

            console.log("\n==========================================");
            console.log("🛡 ROLE AUTHORIZATION");
            console.log("==========================================");

            if (!req.user) {

                return errorResponse(
                    res,
                    "Unauthorized access.",
                    401
                );

            }

            console.log("Logged In User:");
            console.log(req.user);

            console.log("Allowed Roles:");
            console.log(roles);

            if (!roles.includes(req.user.userType)) {

                return errorResponse(
                    res,
                    "You do not have permission to access this resource.",
                    403
                );

            }

            console.log("✅ ROLE VERIFIED");

            next();

        } catch (error) {

            console.log("\n==========================================");
            console.log("❌ ROLE AUTHORIZATION FAILED");
            console.log("==========================================");
            console.log(error);
            console.log("==========================================\n");

            return errorResponse(
                res,
                "Authorization failed.",
                403
            );

        }

    };

};

module.exports = {
    authenticate,
    authorize,
};