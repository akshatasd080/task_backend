const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Routes
// Routes
const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/company.routes");
const taskRoutes = require("./routes/task.routes");

const app = express();


// ================================
// Middlewares
// ================================

app.use(express.json());

app.use(cors());

app.use(helmet());

app.use(morgan("dev"));


// ================================
// Home Route
// ================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Task Management API Running..."
    });
});


// ================================
// API Routes
// ================================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/company", companyRoutes);

app.use("/api/v1/tasks", taskRoutes);


// ================================
// 404 Handler
// ================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Route Not Found"
    });
});


// ================================
// Error Handler
// ================================

app.use((err, req, res, next) => {

    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });

});


module.exports = app;