-- Recipe Duplicate Detection System
-- Add source tracking and duplicate detection features

-- 1. Add new columns to UserRecipe table
ALTER TABLE "UserRecipe" 
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS is_original boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS duplicate_check_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS duplicate_check_date timestamptz;

-- 2. Create RecipeDuplicateReport table
CREATE TABLE IF NOT EXISTS "RecipeDuplicateReport" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_recipe_id text REFERENCES "UserRecipe"(recipe_id) ON DELETE CASCADE,
  suspected_recipe_id text REFERENCES "UserRecipe"(recipe_id) ON DELETE CASCADE,
  similarity_score decimal(5,2) DEFAULT 0.0, -- 0-100
  match_type text CHECK (match_type IN ('title', 'ingredients', 'steps', 'combined')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  reported_by text REFERENCES "User"(user_id) ON DELETE SET NULL,
  reported_at timestamptz DEFAULT now(),
  admin_notes text,
  reviewed_by text REFERENCES "Admin"(admin_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  UNIQUE (original_recipe_id, suspected_recipe_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_duplicate_report_status ON "RecipeDuplicateReport" (status);
CREATE INDEX IF NOT EXISTS idx_duplicate_report_similarity ON "RecipeDuplicateReport" (similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_duplicate_report_reported_at ON "RecipeDuplicateReport" (reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_source ON "UserRecipe" (source_url) WHERE source_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipe_is_original ON "UserRecipe" (is_original);

-- 4. Enable RLS
ALTER TABLE "RecipeDuplicateReport" ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS duplicate_report_insert ON "RecipeDuplicateReport";
DROP POLICY IF EXISTS duplicate_report_select_own ON "RecipeDuplicateReport";
DROP POLICY IF EXISTS duplicate_report_admin_all ON "RecipeDuplicateReport";

-- 6. Create policies
-- Allow anyone to report duplicates
CREATE POLICY duplicate_report_insert ON "RecipeDuplicateReport"
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own reports
CREATE POLICY duplicate_report_select_own ON "RecipeDuplicateReport"
  FOR SELECT
  USING (reported_by = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Allow admins to view and update all reports
CREATE POLICY duplicate_report_admin_all ON "RecipeDuplicateReport"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Admin" 
      WHERE admin_id = current_setting('request.jwt.claims', true)::json->>'user_id'
    )
  );

-- 7. Add comment documentation
COMMENT ON TABLE "RecipeDuplicateReport" IS 'Tracks suspected duplicate recipes for admin review';
COMMENT ON COLUMN "UserRecipe".source_url IS 'Original source URL if recipe is adapted from external source';
COMMENT ON COLUMN "UserRecipe".is_original IS 'True if user claims recipe is their original creation';
COMMENT ON COLUMN "UserRecipe".duplicate_check_score IS 'AI-generated suspicion score (0-100)';
