-- Clean up duplicate email verification columns
-- Drop the camelCase column, keep the snake_case one
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";

-- Ensure we have the correct column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Ensure we have verification_token column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
