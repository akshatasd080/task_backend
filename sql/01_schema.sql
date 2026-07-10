-- =====================================================
-- Project : Task Management System
-- File    : 01_schema.sql
-- Purpose : Create Database Schema & Common Extensions
-- =====================================================

-- Create Application Schema
CREATE SCHEMA IF NOT EXISTS task_management;

-- Set default schema
SET search_path TO task_management;

-- UUID Extension (Future Ready)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";