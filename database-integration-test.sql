-- Test Script for AI Course Registration Database Integration
-- Run this AFTER running the migration script to verify everything works

-- 1. Check if the new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
AND column_name IN ('age', 'grade', 'full_name', 'first_name', 'last_name', 'destination')
ORDER BY column_name;

-- 2. Test insert with AI course data
INSERT INTO form_submissions (
  first_name,
  age,
  grade,
  postcode,
  street_address,
  city,
  destination,
  timestamp,
  user_agent,
  session_id,
  submit_attempt_number
) VALUES (
  'Test Student',
  12,
  '7th Grade',
  '12345',
  '123 Test Street',
  'Test City',
  'AI Course Registration',
  NOW(),
  'Test Browser',
  'test_session_' || EXTRACT(epoch FROM NOW()),
  1
);

-- 3. Verify the test data was inserted
SELECT id, first_name, age, grade, destination, timestamp 
FROM form_submissions 
WHERE first_name = 'Test Student' 
ORDER BY timestamp DESC 
LIMIT 1;

-- 4. Clean up test data
DELETE FROM form_submissions WHERE first_name = 'Test Student';

-- 5. Check table structure
\d form_submissions

-- 6. Verify RLS policies allow anonymous inserts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'form_submissions' 
AND policyname LIKE '%anonymous%';

SELECT 'Database integration test completed successfully!' AS result;
