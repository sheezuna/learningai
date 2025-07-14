-- Migration script to add missing columns to existing tables
-- Run this if you already have tables created without these columns

-- IMPORTANT: Run this script in your Supabase SQL Editor or database console

-- Add missing columns to user_actions table
ALTER TABLE user_actions 
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET;

-- Add missing columns to page_visits table  
ALTER TABLE page_visits
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Add missing columns to location_permissions table
ALTER TABLE location_permissions
ADD COLUMN IF NOT EXISTS heading DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS speed DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS location_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS location_quality VARCHAR(50);

-- Add missing columns to form_submissions table
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS location_quality VARCHAR(50),
ADD COLUMN IF NOT EXISTS validation_errors_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_journey JSONB;

-- Fix form_completion_time column type (if it exists as INTEGER)
-- First add the new column with BIGINT type
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS form_completion_time_new BIGINT;

-- If you have existing data in form_completion_time (INTEGER), copy it over
UPDATE form_submissions 
SET form_completion_time_new = form_completion_time 
WHERE form_completion_time IS NOT NULL;

-- Drop the old column and rename the new one
-- NOTE: Uncomment these lines after verifying the data copy worked
-- ALTER TABLE form_submissions DROP COLUMN IF EXISTS form_completion_time;
-- ALTER TABLE form_submissions RENAME COLUMN form_completion_time_new TO form_completion_time;

-- OR if table is empty or form_completion_time doesn't exist yet:
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS form_completion_time BIGINT;

-- Optional: Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_page_visits_url ON page_visits(url);
CREATE INDEX IF NOT EXISTS idx_user_actions_ip ON user_actions(ip_address);
CREATE INDEX IF NOT EXISTS idx_form_submissions_location_quality ON form_submissions(location_quality);
CREATE INDEX IF NOT EXISTS idx_location_permissions_method ON location_permissions(location_method);

-- Verify the schema changes
SELECT 'user_actions columns:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_actions' 
ORDER BY ordinal_position;

SELECT 'page_visits columns:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'page_visits' 
ORDER BY ordinal_position;

SELECT 'location_permissions columns:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'location_permissions' 
ORDER BY ordinal_position;

SELECT 'form_submissions columns:' as table_info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
ORDER BY ordinal_position;
