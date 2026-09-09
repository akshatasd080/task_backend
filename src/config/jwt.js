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

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

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

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        return decoded;

    } catch (error) {
        throw error;
    }

};

module.exports = {
    generateToken,
    verifyToken,
};