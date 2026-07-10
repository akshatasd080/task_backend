const express = require("express");

console.log("✅ admin.routes.js loaded");

const router = express.Router();

router.get("/hello", (req, res) => {
    res.send("Hello Admin");
});

router.post("/login", (req, res) => {
    res.json({
        success: true,
        message: "Login Route Working",
        body: req.body
    });
});

module.exports = router;