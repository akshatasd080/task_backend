-- Company-level designation master
CREATE TABLE IF NOT EXISTS task_management.designations (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    designation_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_designations_company
        FOREIGN KEY (company_id)
        REFERENCES task_management.companies(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_designations_company
ON task_management.designations(company_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_designation_active
ON task_management.designations (company_id, lower(designation_name))
WHERE deleted_at IS NULL;

INSERT INTO task_management.permissions (permission_name, module_name, description)
VALUES
    ('designation.view', 'designation', 'View designations'),
    ('designation.create', 'designation', 'Create designations'),
    ('designation.update', 'designation', 'Update designations'),
    ('designation.delete', 'designation', 'Delete designations')
ON CONFLICT (permission_name) DO NOTHING;

INSERT INTO task_management.role_permissions (role_id, permission_id, assigned_by)
SELECT r.id, p.id, r.created_by
FROM task_management.roles r
INNER JOIN task_management.permissions p
    ON p.permission_name IN (
        'designation.view',
        'designation.create',
        'designation.update',
        'designation.delete'
    )
WHERE r.role_name = 'Company Admin'
  AND r.is_system = TRUE
  AND r.deleted_at IS NULL
ON CONFLICT (role_id, permission_id) DO UPDATE SET is_active = TRUE;
