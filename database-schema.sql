-- Qatar Airways User Tracking Database Schema
-- 
-- COMPLETE DATABASE SCHEMA - This is the single source of truth
-- 
-- This schema file contains all tables, columns, indexes, and policies needed
-- for the Qatar Airways user tracking application. 
--
-- USAGE:
-- 1. Run this entire script in your Supabase SQL Editor to create all tables
-- 2. The script includes DROP statements so it can be run multiple times safely
-- 3. All required columns are included - no migration scripts needed
--
-- TABLES CREATED:
-- - page_visits: Track page navigation and user sessions
-- - user_actions: General action tracking with error handling
-- - location_permissions: GPS/location data and permissions
-- - form_interactions: Track individual form field interactions
-- - form_submissions: Main form data storage with comprehensive tracking
--
-- FEATURES:
-- - Row Level Security (RLS) enabled
-- - Anonymous insert policies for public forms
-- - Authenticated read access for admin dashboards
-- - Performance indexes for common queries
-- - Comprehensive error tracking and user journey data

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS form_interactions CASCADE;
DROP TABLE IF EXISTS location_permissions CASCADE;
DROP TABLE IF EXISTS user_actions CASCADE;
DROP TABLE IF EXISTS page_visits CASCADE;

-- 1. Page visits tracking
CREATE TABLE page_visits (
    id BIGSERIAL PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    url TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User actions (primary backup tracking table)
CREATE TABLE user_actions (
    id BIGSERIAL PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    action_data JSONB,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    url TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Location permissions tracking
CREATE TABLE location_permissions (
    id BIGSERIAL PRIMARY KEY,
    permission_status VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude DECIMAL(10, 2),
    accuracy DECIMAL(10, 2),
    heading DECIMAL(6, 2),
    speed DECIMAL(8, 2),
    location_method VARCHAR(50),
    location_quality VARCHAR(50),
    error_code INTEGER,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Form interactions tracking
CREATE TABLE form_interactions (
    id BIGSERIAL PRIMARY KEY,
    interaction_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    field_value TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MAIN FORM SUBMISSIONS TABLE - Complete with all required fields
CREATE TABLE form_submissions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Basic form fields
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    postcode VARCHAR(50) NOT NULL,
    street_address VARCHAR(500) NOT NULL,
    city VARCHAR(255),
    destination VARCHAR(255) NOT NULL,
    
    -- Location data (optional)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2),
    location_method VARCHAR(100),
    location_timestamp TIMESTAMPTZ,
    location_quality VARCHAR(50),
    
    -- Core tracking
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(255) NOT NULL,
    
    -- Browser data (all optional)
    browser_language VARCHAR(50),
    browser_timezone VARCHAR(100),
    browser_screen VARCHAR(50),
    browser_platform VARCHAR(100),
    browser_cookies BOOLEAN,
    
    -- Tracking data (all optional)
    submit_attempt_number INTEGER DEFAULT 1,
    referrer TEXT,
    page_url TEXT,
    device_memory INTEGER,
    connection_type VARCHAR(50),
    time_zone_offset INTEGER,
    local_storage_available BOOLEAN,
    form_completion_time BIGINT,
    validation_errors_count INTEGER DEFAULT 0,
    user_journey JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_page_visits_session ON page_visits(session_id);
CREATE INDEX idx_user_actions_session ON user_actions(session_id);
CREATE INDEX idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX idx_location_permissions_session ON location_permissions(session_id);
CREATE INDEX idx_form_interactions_session ON form_interactions(session_id);
CREATE INDEX idx_form_submissions_session ON form_submissions(session_id);
CREATE INDEX idx_form_submissions_timestamp ON form_submissions(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for your public form)
CREATE POLICY "anonymous_insert_page_visits" ON page_visits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anonymous_insert_user_actions" ON user_actions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anonymous_insert_location_permissions" ON location_permissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anonymous_insert_form_interactions" ON form_interactions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anonymous_insert_form_submissions" ON form_submissions FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to read data (for admin dashboard)
CREATE POLICY "authenticated_read_page_visits" ON page_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_user_actions" ON user_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_location_permissions" ON location_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_form_interactions" ON form_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_form_submissions" ON form_submissions FOR SELECT TO authenticated USING (true);

-- Allow service role full access (for admin operations)
CREATE POLICY "service_role_all_page_visits" ON page_visits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_user_actions" ON user_actions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_location_permissions" ON location_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_form_interactions" ON form_interactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_form_submissions" ON form_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
