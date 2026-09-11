/**
 * Apply CRM SQL migrations in order.
 * Usage: node scripts/runMigrations.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

const FILES = [
    "01_schema.sql",
    "02_companies.sql",
    "03_departments.sql",
    "04_permissions.sql",
    "05_roles.sql",
    "06_role_permissions.sql",
    "07_users.sql",
    "08_projects.sql",
    "09_project_members.sql",
    "10_tasks.sql",
    "11_task_comments.sql",
    "12_task_attachments.sql",
    "13_notifications.sql",
    "14_activity_logs.sql",
    "15_system_admins.sql",
    "16_alter_for_crm.sql",
    "19_task_statuses.sql",
    "20_designations.sql",
    "21_task_workflow.sql",
    "17_seed_permissions.sql",
    "18_seed_demo_company.sql",
    "99_seed.sql",
];

async function run() {
    const sqlDir = path.join(__dirname, "../sql");

    for (const file of FILES) {
        const fullPath = path.join(sqlDir, file);
        if (!fs.existsSync(fullPath)) {
            console.warn(`Skip missing: ${file}`);
            continue;
        }

        const sql = fs.readFileSync(fullPath, "utf8");
        console.log(`Running ${file}...`);
        try {
            await pool.query(sql);
            console.log(`OK: ${file}`);
        } catch (err) {
            // Allow idempotent re-runs; log and continue for common cases
            console.error(`WARN ${file}: ${err.message}`);
        }
    }

    await pool.end();
    console.log("Migrations finished.");
}

run().catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
});
