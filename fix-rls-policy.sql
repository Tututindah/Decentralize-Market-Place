-- =====================================================
-- FIX: Add INSERT policy for users table
-- =====================================================
-- The current schema is missing an INSERT policy for the users table
-- This causes "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor to fix

-- Add INSERT policy to allow anyone to create a user profile
CREATE POLICY "Users insertable by all" ON users FOR INSERT WITH CHECK (true);

-- =====================================================
-- ALTERNATIVE: More secure policy (recommended for production)
-- =====================================================
-- If you want more security, you can restrict inserts to authenticated users only:
-- DROP POLICY "Users insertable by all" ON users;
-- CREATE POLICY "Users insertable by authenticated" ON users 
--   FOR INSERT WITH CHECK (auth.uid()::text IS NOT NULL);

-- =====================================================
-- To apply this fix:
-- =====================================================
-- 1. Go to: https://app.supabase.com/project/aqiybscsjizeocgytvrj/editor
-- 2. Click "New Query"
-- 3. Copy and paste the policy above
-- 4. Click "Run" or press Ctrl+Enter
-- 5. You should see "Success. No rows returned"
-- 6. Restart your dev server

-- =====================================================
-- Verify the fix:
-- =====================================================
-- After running the policy, you can verify it was created:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
