const { body } = require("express-validator");
const { emailField } = require("./common");

const loginValidation = [

    emailField("email"),

    body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is required."),

];

module.exports = {
    loginValidation,
};