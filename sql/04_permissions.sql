-- ============================================
-- File: 04_permissions.sql
-- Description: Master Permissions Table
-- ============================================

CREATE TABLE IF NOT EXISTS task_management.permissions (

    id BIGSERIAL PRIMARY KEY,

    permission_name VARCHAR(100) NOT NULL UNIQUE,

    module_name VARCHAR(100) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- Permission List

-- Main thoda aur improve karunga.

-- Company
-- company.create
-- company.update
-- company.delete
-- company.view
-- Department
-- department.create
-- department.update
-- department.delete
-- department.view
-- User
-- user.create
-- user.update
-- user.delete
-- user.view
-- Role
-- role.create
-- role.update
-- role.delete
-- role.view
-- Project
-- project.create
-- project.update
-- project.delete
-- project.view
-- Task
-- task.create
-- task.update
-- task.delete
-- task.view
-- task.assign
-- task.change_status
-- Dashboard
-- dashboard.view
-- Reports
-- reports.view