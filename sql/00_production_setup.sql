-- ============================================================================
-- Task Management CRM — Production Database Setup
-- ============================================================================
-- Run as PostgreSQL superuser (postgres)
-- Example: psql -U postgres -h localhost -p 5432 -f 00_production_setup.sql
-- Or paste step-by-step in pgAdmin Query Tool
-- ============================================================================

-- 1️⃣ Connect as PostgreSQL superuser
-- psql -U postgres -h localhost -p 5432

-- 2️⃣ Create application user (role)
CREATE USER "task_management_user"
WITH PASSWORD 'Task_Management@2026';

-- 3️⃣ Create database and assign ownership
CREATE DATABASE "task_management_db"
OWNER "task_management_user";

-- 4️⃣ Restrict public access and grant access to application user
REVOKE CONNECT ON DATABASE "task_management_db" FROM PUBLIC;
GRANT CONNECT ON DATABASE "task_management_db" TO "task_management_user";

-- 5️⃣ Connect to the database
-- \c task_management_db
-- (In pgAdmin: open Query Tool on task_management_db, then continue from step 6)

-- 6️⃣ Create schema
CREATE SCHEMA IF NOT EXISTS task_management
AUTHORIZATION "task_management_user";

-- 7️⃣ Secure schema permissions
REVOKE ALL ON SCHEMA task_management FROM PUBLIC;

GRANT USAGE ON SCHEMA task_management
TO "task_management_user";

GRANT CREATE ON SCHEMA task_management
TO "task_management_user";

-- 8️⃣ Configure default privileges for future tables
ALTER DEFAULT PRIVILEGES
FOR ROLE "task_management_user"
IN SCHEMA task_management
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLES TO "task_management_user";

-- Configure default privileges for future sequences
ALTER DEFAULT PRIVILEGES
FOR ROLE "task_management_user"
IN SCHEMA task_management
GRANT USAGE, SELECT
ON SEQUENCES TO "task_management_user";

-- 9️⃣ Set default search path
ALTER ROLE "task_management_user"
SET search_path = task_management, public;

-- 🔟 Install required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1️⃣1️⃣ Grant additional permissions
GRANT CONNECT ON DATABASE "task_management_db"
TO "task_management_user";

GRANT USAGE, CREATE ON SCHEMA task_management
TO "task_management_user";

GRANT ALL PRIVILEGES ON DATABASE "task_management_db"
TO "task_management_user";

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA task_management
TO "task_management_user";

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA task_management
TO "task_management_user";

-- 1️⃣2️⃣ Ensure future objects automatically inherit permissions
ALTER DEFAULT PRIVILEGES
IN SCHEMA task_management
GRANT ALL PRIVILEGES ON TABLES
TO "task_management_user";

ALTER DEFAULT PRIVILEGES
IN SCHEMA task_management
GRANT ALL PRIVILEGES ON SEQUENCES
TO "task_management_user";
