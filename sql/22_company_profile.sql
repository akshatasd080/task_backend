-- =====================================================
-- File: 22_company_profile.sql
-- Description: Organization profile location + preference fields
-- =====================================================

ALTER TABLE task_management.companies
    ADD COLUMN IF NOT EXISTS country VARCHAR(80),
    ADD COLUMN IF NOT EXISTS state VARCHAR(80),
    ADD COLUMN IF NOT EXISTS city VARCHAR(80),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
    ADD COLUMN IF NOT EXISTS notify_all_users BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS allow_self_registration BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS show_in_reports BOOLEAN NOT NULL DEFAULT TRUE;
