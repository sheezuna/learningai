-- Migration to add AI Course fields to form_submissions table
-- Run this in your Supabase SQL editor

-- Add new columns for AI course registration
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS grade VARCHAR(100),
ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255);

-- Make destination optional (since we use it as 'AI Course Registration' by default)
ALTER TABLE form_submissions 
ALTER COLUMN destination DROP NOT NULL;

-- Update existing records to have default destination if null
UPDATE form_submissions 
SET destination = 'AI Course Registration' 
WHERE destination IS NULL;

-- Add comments for new fields
COMMENT ON COLUMN form_submissions.age IS 'Student age (8-18 for AI course)';
COMMENT ON COLUMN form_submissions.grade IS 'Student grade/school year';
COMMENT ON COLUMN form_submissions.parent_email IS 'Parent or guardian email address';

-- Create index for better query performance on new fields
CREATE INDEX IF NOT EXISTS idx_form_submissions_age ON form_submissions(age);
CREATE INDEX IF NOT EXISTS idx_form_submissions_grade ON form_submissions(grade);
CREATE INDEX IF NOT EXISTS idx_form_submissions_parent_email ON form_submissions(parent_email);
