-- ============================================
-- CLEANUP ALL DATA
-- ============================================
-- This script deletes all data from all tables while preserving the schema.
-- WARNING: This will permanently delete all data. Use with caution!
-- ============================================

-- Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we'll delete in order)
-- Delete in order to respect foreign key constraints

-- 1. Delete verification records (no foreign key dependencies)
TRUNCATE TABLE credential_verifications CASCADE;

-- 2. Delete credential records (no foreign key dependencies)
TRUNCATE TABLE delivery_credentials CASCADE;
TRUNCATE TABLE collection_credentials CASCADE;

-- 3. Delete audit logs (references users but ON DELETE SET NULL, so safe)
TRUNCATE TABLE audit_logs CASCADE;

-- 4. Delete organisation parts cache (no dependencies)
TRUNCATE TABLE organisation_parts_cache CASCADE;

-- 5. Delete OAuth tokens (references users)
TRUNCATE TABLE oauth_tokens CASCADE;

-- 6. Delete sessions (references users)
TRUNCATE TABLE sessions CASCADE;

-- 7. Delete users (last, as other tables reference it)
-- Note: This will cascade delete sessions and oauth_tokens due to ON DELETE CASCADE
TRUNCATE TABLE users CASCADE;

-- 8. Delete migration tracking (optional - comment out if you want to keep migration history)
-- TRUNCATE TABLE schema_migrations CASCADE;

-- ============================================
-- RESET SEQUENCES (if any exist)
-- ============================================
-- Note: The tables use UUIDs or VARCHAR IDs, so no sequences to reset
-- If you add tables with SERIAL/BIGSERIAL in the future, add sequence resets here

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify all tables are empty:
-- SELECT 
--     'users' as table_name, COUNT(*) as row_count FROM users
-- UNION ALL
-- SELECT 'sessions', COUNT(*) FROM sessions
-- UNION ALL
-- SELECT 'collection_credentials', COUNT(*) FROM collection_credentials
-- UNION ALL
-- SELECT 'delivery_credentials', COUNT(*) FROM delivery_credentials
-- UNION ALL
-- SELECT 'credential_verifications', COUNT(*) FROM credential_verifications
-- UNION ALL
-- SELECT 'oauth_tokens', COUNT(*) FROM oauth_tokens
-- UNION ALL
-- SELECT 'organisation_parts_cache', COUNT(*) FROM organisation_parts_cache
-- UNION ALL
-- SELECT 'audit_logs', COUNT(*) FROM audit_logs;
