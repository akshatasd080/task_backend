/**
 * Seed demo company users.
 * Usage: node scripts/seedDemoUsers.js
 * Reads DEMO_USER_PASSWORD from env (default used only for local demo).
 */
require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../src/config/db");

const DEMO_USERS = [
    { email: "admin@acme.com", first_name: "Company", last_name: "Admin", role_name: "Company Admin", phone: "9000000001" },
    { email: "manager@acme.com", first_name: "Maya", last_name: "Manager", role_name: "Manager", phone: "9000000002" },
    { email: "lead@acme.com", first_name: "Tara", last_name: "Lead", role_name: "Team Lead", phone: "9000000003" },
    { email: "rahul@acme.com", first_name: "Rahul", last_name: "Employee", role_name: "Employee", phone: "9000000004" },
];

async function seed() {
    const password = process.env.DEMO_USER_PASSWORD || "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const companyResult = await pool.query(
        `SELECT id FROM task_management.companies WHERE company_code = 'ACME' LIMIT 1`
    );

    if (companyResult.rows.length === 0) {
        console.error("Demo company ACME not found. Run sql/18_seed_demo_company.sql first.");
        process.exit(1);
    }

    const companyId = companyResult.rows[0].id;

    for (const user of DEMO_USERS) {
        const roleResult = await pool.query(
            `
            SELECT id FROM task_management.roles
            WHERE company_id = $1 AND role_name = $2
            LIMIT 1
            `,
            [companyId, user.role_name]
        );

        if (roleResult.rows.length === 0) {
            console.warn(`Role missing: ${user.role_name}`);
            continue;
        }

        const roleId = roleResult.rows[0].id;

        await pool.query(
            `
            INSERT INTO task_management.users
            (company_id, role_id, first_name, last_name, email, phone, password, is_active)
            SELECT $1::bigint, $2::bigint, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::varchar, TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM task_management.users
                WHERE company_id = $1::bigint AND email = $5::varchar
            )
            `,
            [
                companyId,
                roleId,
                user.first_name,
                user.last_name,
                user.email,
                user.phone,
                hashedPassword,
            ]
        );

        console.log(`Ensured user: ${user.email} (${user.role_name})`);
    }

    // Also ensure system admin password is usable for local demo
    const adminHash = await bcrypt.hash(password, 10);
    await pool.query(
        `
        UPDATE task_management.system_admins
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE email = 'admin@system.com'
        `,
        [adminHash]
    );
    console.log("Updated system admin password for admin@system.com");

    await pool.end();
    console.log("Demo user seed complete.");
}

seed().catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
});
