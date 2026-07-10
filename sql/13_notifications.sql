-- =====================================================
-- File: 13_notifications.sql
-- Description: Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS task_management.notifications (

    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES task_management.users(id)
        ON DELETE CASCADE

);