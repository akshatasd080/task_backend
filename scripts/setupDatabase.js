/**
 * Create database if missing, then apply migrations.
 * Usage: node scripts/setupDatabase.js
 */
require("dotenv").config();
const { Client, Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const dbName = process.env.DB_NAME || "task_management_db";

const baseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

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
  "17_seed_permissions.sql",
  "18_seed_demo_company.sql",
  "99_seed.sql",
];

async function ensureDatabase() {
  const client = new Client({ ...baseConfig, database: "postgres" });
  await client.connect();
  const exists = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );
  if (exists.rows.length === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database exists: ${dbName}`);
  }
  await client.end();
}

async function runMigrations(pool) {
  const sqlDir = path.join(__dirname, "../sql");
  for (const file of FILES) {
    const fullPath = path.join(sqlDir, file);
    if (!fs.existsSync(fullPath)) continue;
    const sql = fs.readFileSync(fullPath, "utf8");
    console.log(`Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`OK: ${file}`);
    } catch (err) {
      console.error(`WARN ${file}: ${err.message}`);
    }
  }
}

async function seedDemoUsers(pool) {
  const password = process.env.DEMO_USER_PASSWORD || "Admin@123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const companyResult = await pool.query(
    `SELECT id FROM task_management.companies WHERE company_code = 'ACME' LIMIT 1`
  );
  if (companyResult.rows.length === 0) {
    console.warn("ACME company missing; skip demo users");
    return;
  }

  const companyId = companyResult.rows[0].id;
  const users = [
    { email: "admin@acme.com", first_name: "Company", last_name: "Admin", role_name: "Company Admin", phone: "9000000001" },
    { email: "manager@acme.com", first_name: "Maya", last_name: "Manager", role_name: "Manager", phone: "9000000002" },
    { email: "lead@acme.com", first_name: "Tara", last_name: "Lead", role_name: "Team Lead", phone: "9000000003" },
    { email: "rahul@acme.com", first_name: "Rahul", last_name: "Employee", role_name: "Employee", phone: "9000000004" },
  ];

  for (const user of users) {
    const roleResult = await pool.query(
      `SELECT id FROM task_management.roles WHERE company_id = $1 AND role_name = $2 LIMIT 1`,
      [companyId, user.role_name]
    );
    if (!roleResult.rows[0]) continue;

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
      [companyId, roleResult.rows[0].id, user.first_name, user.last_name, user.email, user.phone, hashedPassword]
    );
    console.log(`User ready: ${user.email}`);
  }

  await pool.query(
    `
    UPDATE task_management.system_admins
    SET password = $1, updated_at = CURRENT_TIMESTAMP
    WHERE email = 'admin@system.com'
    `,
    [hashedPassword]
  );
  console.log("System admin password updated: admin@system.com");
}

async function main() {
  await ensureDatabase();
  const pool = new Pool({ ...baseConfig, database: dbName });
  await runMigrations(pool);
  await seedDemoUsers(pool);
  await pool.end();
  console.log("Database setup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
