-- AI Course Registration Migration
-- This script adds the missing columns for AI course registration to the form_submissions table
-- Run this in your Supabase SQL Editor to fix the integration issue

-- Add missing columns for AI course registration
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS grade VARCHAR(100),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Remove parent_email column if it exists (not needed for AI course)
ALTER TABLE form_submissions 
DROP COLUMN IF EXISTS parent_email;

-- Add helpful indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_form_submissions_age ON form_submissions(age);
CREATE INDEX IF NOT EXISTS idx_form_submissions_grade ON form_submissions(grade);
CREATE INDEX IF NOT EXISTS idx_form_submissions_full_name ON form_submissions(full_name);

-- Add comments for clarity
COMMENT ON COLUMN form_submissions.age IS 'Student age (8-18 for AI course)';
COMMENT ON COLUMN form_submissions.grade IS 'Student grade/school year';
COMMENT ON COLUMN form_submissions.full_name IS 'Student full name (matches first_name + last_name)';

-- Update the destination field for existing records to reflect AI course
UPDATE form_submissions SET destination = 'AI Course Registration' WHERE destination IS NULL OR destination = '';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
AND column_name IN ('age', 'grade', 'full_name', 'first_name', 'last_name', 'destination')
ORDER BY column_name;

-- Show the complete table structure for verification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
ORDER BY ordinal_position;
