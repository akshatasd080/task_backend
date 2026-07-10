require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {

    try {

        await pool.query("SELECT NOW()");

        console.log("✅ PostgreSQL Connected");

        app.listen(PORT, () => {
            console.log(`🚀 Server Running on Port ${PORT}`);
        });

    } catch (error) {

        console.error(error);

    }

}

startServer();