-- Migration number: 0002 	 2024-12-27T22:30:00.000Z
-- Add role and additional user fields
ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE user ADD COLUMN first_name TEXT;
ALTER TABLE user ADD COLUMN last_name TEXT;
ALTER TABLE user ADD COLUMN last_login TIMESTAMP;
ALTER TABLE user ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE user ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id); 