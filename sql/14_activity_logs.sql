-- =====================================================
-- File: 14_activity_logs.sql
-- Description: Activity Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.activity_logs (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    module_name VARCHAR(100) NOT NULL,

    action VARCHAR(100) NOT NULL,

    reference_id BIGINT,

    description TEXT,

    ip_address VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_log_user
        FOREIGN KEY (user_id)
        REFERENCES task_management.users(id)
        ON DELETE CASCADE

);