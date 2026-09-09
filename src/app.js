const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// =======================================
// Routes
// =======================================

const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/company.routes");
const departmentRoutes = require("./routes/department.routes");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();


// =======================================
// Middlewares
// =======================================

app.use(express.json());

app.use(cors());

app.use(helmet());

app.use(morgan("dev"));


// =======================================
// Static Uploads
// =======================================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);


// =======================================
// Home Route
// =======================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Task Management API Running..."
    });

});


// =======================================
// API Routes
// =======================================

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/company", companyRoutes);

app.use("/api/v1/department", departmentRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/roles", roleRoutes);

app.use("/api/v1/projects", projectRoutes);

app.use("/api/v1/tasks", taskRoutes);

app.use("/api/v1/notifications", notificationRoutes);

app.use("/api/v1/dashboard", dashboardRoutes);


// =======================================
// 404 Handler
// =======================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API Route Not Found"
    });

});


// =======================================
// Global Error Handler
// =======================================

app.use((err, req, res, next) => {

    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });

});


module.exports = app;
