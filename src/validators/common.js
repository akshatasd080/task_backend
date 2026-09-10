const { body } = require("express-validator");

const EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const EMAIL_MESSAGE =
    "Please enter a valid email (e.g. name@gmail.com, name@yahoo.com).";

const PHONE_MESSAGE = "Phone number must be exactly 10 digits.";

const emailField = (field, { required = true, label = "Email" } = {}) => {
    let chain = body(field).trim();

    if (required) {
        chain = chain.notEmpty().withMessage(`${label} is required.`);
    } else {
        chain = chain.optional({ checkFalsy: true });
    }

    return chain
        .isEmail()
        .withMessage(EMAIL_MESSAGE)
        .matches(EMAIL_REGEX)
        .withMessage(EMAIL_MESSAGE);
};

const phoneField = (field = "phone", { required = false } = {}) => {
    if (!required) {
        return body(field)
            .optional({ checkFalsy: true })
            .customSanitizer((value) => String(value ?? "").replace(/\D/g, ""))
            .matches(/^\d{10}$/)
            .withMessage(PHONE_MESSAGE);
    }

    return body(field)
        .customSanitizer((value) => String(value ?? "").replace(/\D/g, ""))
        .notEmpty()
        .withMessage("Phone number is required.")
        .matches(/^\d{10}$/)
        .withMessage(PHONE_MESSAGE);
};

module.exports = {
    EMAIL_REGEX,
    EMAIL_MESSAGE,
    PHONE_MESSAGE,
    emailField,
    phoneField,
};
