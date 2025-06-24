-- Migration number: 0003 	 2024-12-27T23:00:00.000Z
-- Add default admin user
INSERT INTO user (
    email, 
    role, 
    first_name, 
    last_name, 
    is_active, 
    updated_at,
    created_at
) VALUES (
    'admin@myauth.com',
    'admin',
    'System',
    'Administrator',
    1,
    datetime('now'),
    datetime('now')
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    first_name = 'System',
    last_name = 'Administrator',
    is_active = 1,
    updated_at = datetime('now'); 