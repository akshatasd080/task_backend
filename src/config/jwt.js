const jwt = require("jsonwebtoken");

/**
 * ==================================================
 * Generate JWT Access Token
 * ==================================================
 * @param {Object} payload
 * @returns {String}
 */
const generateToken = (payload) => {

    try {

        console.log("====================================");
        console.log("GENERATING JWT TOKEN");
        console.log("JWT Secret:", process.env.JWT_SECRET);
        console.log("Payload:", payload);
        console.log("Expires In:", process.env.JWT_EXPIRES_IN);

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        console.log("Token Generated Successfully");
        console.log("====================================");

        return token;

    } catch (error) {

        console.error("JWT Generate Error:", error);

        throw new Error("Failed to generate access token.");

    }

};


/**
 * ==================================================
 * Verify JWT Access Token
 * ==================================================
 * @param {String} token
 * @returns {Object}
 */
const verifyToken = (token) => {

    try {

        console.log("====================================");
        console.log("VERIFYING JWT TOKEN");
        console.log("JWT Secret:", process.env.JWT_SECRET);
        console.log("Received Token:", token);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("Token Verified Successfully");
        console.log("Decoded Payload:", decoded);
        console.log("====================================");

        return decoded;

    } catch (error) {

        console.log("====================================");
        console.log("JWT VERIFICATION FAILED");
        console.log("Error Name:", error.name);
        console.log("Error Message:", error.message);
        console.log("====================================");

        throw error;

    }

};

module.exports = {
    generateToken,
    verifyToken,
};