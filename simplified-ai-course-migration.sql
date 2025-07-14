-- Updated AI Course database migration for simplified form
-- Run this in your Supabase SQL editor

-- Update the form_submissions table for simplified AI course registration
-- The form now collects: Full Name, Age, Grade, and Address (focus on location data)

-- Update existing records to use first_name for full name if needed
UPDATE form_submissions 
SET first_name = COALESCE(CONCAT(first_name, ' ', last_name), first_name)
WHERE last_name IS NOT NULL AND first_name IS NOT NULL;

-- Make destination optional and set default for course registrations
ALTER TABLE form_submissions 
ALTER COLUMN destination DROP NOT NULL;

UPDATE form_submissions 
SET destination = 'AI Course Registration' 
WHERE destination IS NULL OR destination = '';

-- Add comments for clarity
COMMENT ON COLUMN form_submissions.first_name IS 'Full name of the student (simplified from separate first/last)';
COMMENT ON COLUMN form_submissions.last_name IS 'No longer used - kept for backwards compatibility';
COMMENT ON COLUMN form_submissions.age IS 'Student age (8-18 for AI course)';
COMMENT ON COLUMN form_submissions.grade IS 'Student grade/school year';
COMMENT ON COLUMN form_submissions.parent_email IS 'No longer collected - kept for backwards compatibility';

-- The simplified form focuses on:
-- 1. Full Name (stored in first_name field)
-- 2. Age (8-18 validation)
-- 3. Grade/School Year
-- 4. Complete Address (postcode, street_address, city)
-- 5. Location data (GPS coordinates when available)

-- This ensures we capture the essential address information for location tracking
-- while keeping the form simple and user-friendly
