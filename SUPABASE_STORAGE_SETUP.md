# Supabase Storage Setup

## Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `hjecmsvuwexqdkhwylqw`
3. Click **Storage** in the left sidebar
4. Click **New bucket**
5. Configure:
   - **Name**: `images`
   - **Public bucket**: ✅ Enable (so images are publicly accessible)
   - **File size limit**: 5MB (or adjust as needed)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/gif, image/webp`
6. Click **Create bucket**

## Set Bucket Policies

After creating the bucket, set up policies for public read access:

1. In Storage, click on the `images` bucket
2. Click **Policies** tab
3. Click **New policy**
4. Create a policy for SELECT (read):
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'images');
   ```

5. Create a policy for INSERT (upload) - authenticated users only:
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'images');
   ```

6. Create a policy for DELETE - users can delete their own files:
   ```sql
   CREATE POLICY "Users can delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'images');
   ```

## Update Image URLs in Frontend

Once the bucket is created, images will be served from:
```
https://hjecmsvuwexqdkhwylqw.supabase.co/storage/v1/object/public/images/[filename]
```

The code has been updated to automatically use Supabase Storage URLs.

## Migration: Move Existing Images

To migrate your existing images from `public/images/` to Supabase Storage:

### Option 1: Manual Upload via Dashboard
1. Go to Storage → images bucket
2. Click **Upload file**
3. Upload each image from `Backend/public/images/`

### Option 2: Script to Upload (if needed)
See `scripts/migrate-images-to-supabase.js` for bulk upload script.

## Testing

After setup:
1. Try uploading a new profile image
2. Try creating a new post with images
3. Try creating a new recipe with images
4. Verify images are visible in the Supabase Storage dashboard
5. Verify image URLs work in browser

## Rollback (if needed)

If you need to revert to local file storage:
1. Change `require('../middleware/supabaseUploadMiddleware')` back to `require('../middleware/uploadMiddleware')` in:
   - `routes/postRoutes.js`
   - `routes/userRoutes.js`
2. Redeploy

## Notes

- Vercel serverless functions don't have persistent file storage
- Supabase Storage provides cloud storage with CDN
- Free tier: 1GB storage, 2GB bandwidth per month
- Images are automatically deleted if you delete them from Supabase dashboard
- Old images in `public/images/` will still work until you migrate them
