const express = require("express");

const AdminService = require("./admin.service");

const router = express.Router();

router.get("/test", async (req, res) => {

    try {

        const admin = await AdminService.login(
            "admin@system.com",
            "admin123"
        );

        res.json(admin);

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

});

module.exports = router;