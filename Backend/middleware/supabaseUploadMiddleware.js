const multer = require('multer');
const { supabase } = require('../config/supabase');

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// Create multer upload instance
const multerUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware to upload files to Supabase Storage
const uploadToSupabase = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next(); // No files to upload
    }

    const uploadedFiles = [];
    const files = [];

    // Collect all files from req.files (multiple fields) or req.file (single field)
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        if (Array.isArray(req.files[fieldName])) {
          files.push(...req.files[fieldName]);
        } else {
          files.push(req.files[fieldName]);
        }
      });
    } else if (req.file) {
      files.push(req.file);
    }

    // Upload each file to Supabase Storage
    for (const file of files) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage bucket 'images'
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      uploadedFiles.push({
        filename: fileName,
        url: urlData.publicUrl,
        fieldname: file.fieldname
      });
    }

    // Attach uploaded file info to request
    req.uploadedFiles = uploadedFiles;
    
    // For backward compatibility, set req.file and req.files
    if (uploadedFiles.length === 1) {
      req.file = { filename: uploadedFiles[0].filename };
    }
    
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        req.files[fieldName] = uploadedFiles
          .filter(f => f.fieldname === fieldName)
          .map(f => ({ filename: f.filename }));
      });
    }

    next();
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image', 
      error: error.message 
    });
  }
};

// Export combined middleware
module.exports = {
  single: (fieldName) => [multerUpload.single(fieldName), uploadToSupabase],
  fields: (fields) => [multerUpload.fields(fields), uploadToSupabase],
  array: (fieldName, maxCount) => [multerUpload.array(fieldName, maxCount), uploadToSupabase]
};
