-- Database Fix Checker
-- Run this script in Supabase SQL Editor to verify all required columns exist

-- Check if all required columns exist in each table
SELECT 'CHECKING location_permissions table...' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'location_permissions' 
ORDER BY ordinal_position;

-- Check if the required columns are present
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_permissions' AND column_name = 'altitude') 
        THEN '✅ altitude column exists'
        ELSE '❌ altitude column MISSING'
    END as altitude_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_permissions' AND column_name = 'heading') 
        THEN '✅ heading column exists'
        ELSE '❌ heading column MISSING'
    END as heading_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_permissions' AND column_name = 'speed') 
        THEN '✅ speed column exists'
        ELSE '❌ speed column MISSING'
    END as speed_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_permissions' AND column_name = 'location_method') 
        THEN '✅ location_method column exists'
        ELSE '❌ location_method column MISSING'
    END as location_method_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'location_permissions' AND column_name = 'location_quality') 
        THEN '✅ location_quality column exists'
        ELSE '❌ location_quality column MISSING'
    END as location_quality_check;

SELECT 'CHECKING form_submissions table...' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
ORDER BY ordinal_position;

-- Check form_submissions table
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'form_submissions' 
            AND column_name = 'form_completion_time' 
            AND data_type = 'bigint'
        ) 
        THEN '✅ form_completion_time is BIGINT'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'form_submissions' 
            AND column_name = 'form_completion_time' 
            AND data_type = 'integer'
        ) 
        THEN '⚠️ form_completion_time is INTEGER (needs to be BIGINT)'
        ELSE '❌ form_completion_time column MISSING'
    END as form_completion_time_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'location_quality') 
        THEN '✅ location_quality column exists'
        ELSE '❌ location_quality column MISSING'
    END as location_quality_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'validation_errors_count') 
        THEN '✅ validation_errors_count column exists'
        ELSE '❌ validation_errors_count column MISSING'
    END as validation_errors_count_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'user_journey') 
        THEN '✅ user_journey column exists'
        ELSE '❌ user_journey column MISSING'
    END as user_journey_check;

-- Quick fix commands if columns are missing:
SELECT '
-- QUICK FIX COMMANDS (run if any columns are missing):
-- For location_permissions:
ALTER TABLE location_permissions ADD COLUMN IF NOT EXISTS heading DECIMAL(6, 2);
ALTER TABLE location_permissions ADD COLUMN IF NOT EXISTS speed DECIMAL(8, 2);
ALTER TABLE location_permissions ADD COLUMN IF NOT EXISTS location_method VARCHAR(50);
ALTER TABLE location_permissions ADD COLUMN IF NOT EXISTS location_quality VARCHAR(50);

-- For form_submissions:
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS location_quality VARCHAR(50);
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS validation_errors_count INTEGER DEFAULT 0;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS user_journey JSONB;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS form_completion_time BIGINT;
' as quick_fix_commands;
