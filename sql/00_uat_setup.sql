-- ============================================================================
-- Task Management CRM — UAT / Local Database Setup
-- ============================================================================
-- Run as PostgreSQL superuser (postgres)
-- Example: psql -U postgres -h localhost -p 5432
-- Or paste in pgAdmin Query Tool
-- ============================================================================

-- 1️⃣ Connect as superuser
-- psql -U postgres -h localhost -p 5432

-- 2️⃣ Create the user (role)
CREATE USER taskmgmt_user WITH PASSWORD 'taskmgmtPass';

-- 3️⃣ Create the database
CREATE DATABASE task_management_db;

-- 4️⃣ Restrict public access and allow your app user
REVOKE CONNECT ON DATABASE task_management_db FROM PUBLIC;
GRANT CONNECT ON DATABASE task_management_db TO taskmgmt_user;

-- 5️⃣ Connect to the database
-- \c task_management_db

-- 6️⃣ Create the schema
CREATE SCHEMA IF NOT EXISTS task_management AUTHORIZATION taskmgmt_user;

-- 7️⃣ Harden schema permissions
REVOKE ALL ON SCHEMA task_management FROM PUBLIC;
GRANT USAGE ON SCHEMA task_management TO taskmgmt_user;
GRANT CREATE ON SCHEMA task_management TO taskmgmt_user;

-- 8️⃣ Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE taskmgmt_user IN SCHEMA task_management
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO taskmgmt_user;

ALTER DEFAULT PRIVILEGES FOR ROLE taskmgmt_user IN SCHEMA task_management
  GRANT USAGE, SELECT ON SEQUENCES TO taskmgmt_user;

-- 9️⃣ Set user search path
ALTER ROLE taskmgmt_user SET search_path = 'task_management', public;

-- 🔟 Create necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT CONNECT ON DATABASE task_management_db TO taskmgmt_user;
GRANT USAGE, CREATE ON SCHEMA task_management TO taskmgmt_user;

GRANT ALL PRIVILEGES ON DATABASE task_management_db TO taskmgmt_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA task_management TO taskmgmt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA task_management TO taskmgmt_user;

-- Optional: also allow postgres superuser to manage schema easily in local/UAT
GRANT ALL ON SCHEMA task_management TO postgres;
