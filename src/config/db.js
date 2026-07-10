const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Handle unexpected database errors
pool.on("error", (error) => {
    console.error("❌ PostgreSQL Pool Error:", error);
    process.exit(1);
});

module.exports = pool;