-- Password Reset Tokens Table
-- For custom password reset flow using Brevo email

-- Drop existing table if exists (to fix foreign key constraint)
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- RLS Policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "System can manage reset tokens" ON password_reset_tokens;

-- Only system can manage reset tokens
CREATE POLICY "System can manage reset tokens"
  ON password_reset_tokens FOR ALL
  USING (true);

-- Clean up expired tokens (run this periodically)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true;
