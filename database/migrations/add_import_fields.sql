-- Migration: Add fields for Excel import functionality
-- This adds missing fields from Zoho Projects to SQUAD PM

-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS work_hours DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_type VARCHAR(50) CHECK (billing_type IN ('Billable', 'Non Billable', 'None') OR billing_type IS NULL);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completion_percentage ON tasks(completion_percentage);

-- Add comment to document the fields
COMMENT ON COLUMN tasks.start_date IS 'Task start date';
COMMENT ON COLUMN tasks.duration_hours IS 'Estimated duration in hours';
COMMENT ON COLUMN tasks.completion_percentage IS 'Task completion percentage (0-100)';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was completed';
COMMENT ON COLUMN tasks.work_hours IS 'Actual work hours spent';
COMMENT ON COLUMN tasks.billing_type IS 'Billing type: Billable, Non Billable, or None';
