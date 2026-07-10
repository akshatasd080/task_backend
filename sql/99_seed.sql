-- =====================================================
-- File: 99_seed.sql
-- Description: Seed Initial Data
-- =====================================================

INSERT INTO task_management.system_admins
(
    first_name,
    last_name,
    email,
    password,
    phone,
    is_active
)
VALUES
(
    'Super',
    'Admin',
    'admin@system.com',

    '$2b$10$k1wbI4X0S6N6HBBN5D5h5eL2dHhE9dKQnQf2i4X4d5qQ4Pz0iD4vW',

    '9999999999',

    TRUE
);