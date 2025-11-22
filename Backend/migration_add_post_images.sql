-- Adds an array column for storing multiple images per community post
ALTER TABLE "CommunityPost"
ADD COLUMN IF NOT EXISTS cpost_images jsonb DEFAULT '[]'::jsonb;

-- Seed the new column with any existing single-image data
UPDATE "CommunityPost"
SET cpost_images = CASE
  WHEN cpost_images IS NULL
    OR jsonb_typeof(cpost_images) <> 'array'
    OR jsonb_array_length(cpost_images) = 0
  THEN CASE
    WHEN cpost_image IS NOT NULL THEN jsonb_build_array(cpost_image)
    ELSE '[]'::jsonb
  END
  ELSE cpost_images
END;
