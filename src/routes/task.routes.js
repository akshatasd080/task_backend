const express = require("express");

const router = express.Router();

const {
    authenticate,
    authorize,
} = require("../middleware/auth.middleware");


// ======================================================
// Get All Tasks
// ======================================================
router.get(
    "/",
    authenticate,
    (req, res) => {

        res.json({
            success: true,
            message: "Task List",
            loggedInUser: req.user
        });

    }
);


// ======================================================
// Create Task
// ======================================================
router.post(
    "/",
    authenticate,
    authorize("SYSTEM_ADMIN", "COMPANY_ADMIN", "PROJECT_MANAGER"),
    (req, res) => {

        res.json({
            success: true,
            message: "Task Created Successfully"
        });

    }
);


// ======================================================
// Update Task
// ======================================================
router.put(
    "/:id",
    authenticate,
    authorize("SYSTEM_ADMIN", "COMPANY_ADMIN", "PROJECT_MANAGER"),
    (req, res) => {

        res.json({
            success: true,
            message: "Task Updated Successfully"
        });

    }
);


// ======================================================
// Delete Task
// ======================================================
router.delete(
    "/:id",
    authenticate,
    authorize("SYSTEM_ADMIN"),
    (req, res) => {

        res.json({
            success: true,
            message: "Task Deleted Successfully"
        });

    }
);

module.exports = router;