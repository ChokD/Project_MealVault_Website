-- ============================================
-- Recipe Duplicate Detection System Migration
-- ============================================
-- Created: 2025-11-27
-- Purpose: Add duplicate detection and reporting features
-- ============================================

-- ====================================
-- 1. Create RecipeDuplicateReport Table
-- ====================================

CREATE TABLE IF NOT EXISTS "RecipeDuplicateReport" (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_recipe_id TEXT NOT NULL REFERENCES "UserRecipe"(recipe_id) ON DELETE CASCADE,
    original_recipe_id TEXT NOT NULL REFERENCES "UserRecipe"(recipe_id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    
    -- Similarity scores
    similarity_score DECIMAL(5,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
    title_similarity DECIMAL(5,2),
    ingredients_similarity DECIMAL(5,2),
    steps_similarity DECIMAL(5,2),
    
    -- Report details
    report_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    admin_notes TEXT,
    
    -- Timestamps
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES "User"(user_id),
    
    -- Constraints
    CONSTRAINT different_recipes CHECK (reported_recipe_id != original_recipe_id)
);

-- ====================================
-- 2. Add Columns to UserRecipe Table
-- ====================================

-- Add source_url column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserRecipe' 
        AND column_name = 'source_url'
    ) THEN
        ALTER TABLE "UserRecipe" ADD COLUMN source_url TEXT;
    END IF;
END $$;

-- Add is_original column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserRecipe' 
        AND column_name = 'is_original'
    ) THEN
        ALTER TABLE "UserRecipe" ADD COLUMN is_original BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add duplicate_check_score column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserRecipe' 
        AND column_name = 'duplicate_check_score'
    ) THEN
        ALTER TABLE "UserRecipe" ADD COLUMN duplicate_check_score DECIMAL(5,2);
    END IF;
END $$;

-- Add duplicate_check_date column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UserRecipe' 
        AND column_name = 'duplicate_check_date'
    ) THEN
        ALTER TABLE "UserRecipe" ADD COLUMN duplicate_check_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ====================================
-- 3. Create Indexes for Performance
-- ====================================

-- Index for report status queries
CREATE INDEX IF NOT EXISTS idx_report_status 
ON "RecipeDuplicateReport"(status);

-- Index for similarity score sorting
CREATE INDEX IF NOT EXISTS idx_report_similarity 
ON "RecipeDuplicateReport"(similarity_score DESC);

-- Index for report date sorting
CREATE INDEX IF NOT EXISTS idx_report_date 
ON "RecipeDuplicateReport"(reported_at DESC);

-- Index for UserRecipe source_url lookups
CREATE INDEX IF NOT EXISTS idx_recipe_source_url 
ON "UserRecipe"(source_url) 
WHERE source_url IS NOT NULL;

-- Index for UserRecipe is_original flag
CREATE INDEX IF NOT EXISTS idx_recipe_is_original 
ON "UserRecipe"(is_original);

-- Index for duplicate check score
CREATE INDEX IF NOT EXISTS idx_recipe_duplicate_score 
ON "UserRecipe"(duplicate_check_score) 
WHERE duplicate_check_score IS NOT NULL;

-- ====================================
-- 4. Enable Row Level Security (RLS)
-- ====================================

-- NOTE: RLS policies are commented out for now to avoid column mismatch errors
-- You can enable them later in Supabase Dashboard > Authentication > Policies

-- Enable RLS on RecipeDuplicateReport (table will be accessible to service role key)
-- ALTER TABLE "RecipeDuplicateReport" ENABLE ROW LEVEL SECURITY;

-- ====================================
-- 5. Add Comments for Documentation
-- ====================================

COMMENT ON TABLE "RecipeDuplicateReport" IS 'Stores duplicate recipe reports from community';
COMMENT ON COLUMN "RecipeDuplicateReport".similarity_score IS 'Overall similarity score (0-100%)';
COMMENT ON COLUMN "RecipeDuplicateReport".status IS 'Report status: pending, approved, rejected, under_review';

COMMENT ON COLUMN "UserRecipe".source_url IS 'URL of original recipe source (if adapted from another source)';
COMMENT ON COLUMN "UserRecipe".is_original IS 'True if recipe is original creation by user';
COMMENT ON COLUMN "UserRecipe".duplicate_check_score IS 'Highest similarity score from duplicate check';
COMMENT ON COLUMN "UserRecipe".duplicate_check_date IS 'Last time recipe was checked for duplicates';

-- ====================================
-- 6. Grant Permissions
-- ====================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on RecipeDuplicateReport
GRANT SELECT, INSERT ON "RecipeDuplicateReport" TO authenticated;
GRANT SELECT ON "RecipeDuplicateReport" TO anon;

-- ============================================
-- Migration Complete
-- ============================================
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables created with: SELECT * FROM "RecipeDuplicateReport" LIMIT 1;
-- 3. Test RLS policies work correctly
-- 4. Deploy Backend with environment variables set
-- ============================================
