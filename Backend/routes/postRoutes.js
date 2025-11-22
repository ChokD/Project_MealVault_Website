const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/supabaseUploadMiddleware');
const { createNotification } = require('./notificationRoutes');
const { moderateContent } = require('./contentModerationRoutes');

// --- PUBLIC ROUTES ---

const parseJsonValue = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const buildFallbackTitle = (rawContent) => {
  if (!rawContent) return 'โพสต์ใหม่';
  const trimmed = rawContent.trim();
  if (!trimmed) return 'โพสต์ใหม่';
  const firstLine = trimmed.split('\n').find((line) => line.trim()) || trimmed;
  return firstLine.slice(0, 80);
};

const parseImageList = (value, fallbackSingle) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return [value];
    }
  }
  if (fallbackSingle) {
    return [fallbackSingle];
  }
  return [];
};

const collectUploadedImages = (filesInput) => {
  if (!filesInput) return [];
  if (Array.isArray(filesInput)) {
    return filesInput.map((file) => file?.filename).filter(Boolean);
  }
  return Object.values(filesInput).flat().map((file) => file?.filename).filter(Boolean);
};

// Optional auth middleware สำหรับ GET recipes
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
    } catch (err) {
      // Ignore invalid token for optional auth
    }
  }
  next();
};

// GET /api/recipes/:recipeId - ดึงรายละเอียดสูตรอาหารจากผู้ใช้
router.get('/recipes/:recipeId', optionalAuth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user?.id; // Optional: สำหรับตรวจสอบว่า user like แล้วหรือยัง
    
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึงสูตรอาหารจาก UserRecipe
    const { data: recipe, error } = await supabase
      .from('UserRecipe')
      .select(`
        recipe_id,
        recipe_title,
        recipe_summary,
        recipe_category,
        prep_time_minutes,
        cook_time_minutes,
        total_time_minutes,
        servings,
        ingredients,
        steps,
        recipe_image,
        created_at,
        updated_at,
        user_id,
        like_count,
        User:user_id (user_fname, user_lname)
      `)
      .eq('recipe_id', recipeId)
      .single();
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (!recipe) {
      return res.status(404).json({ message: 'ไม่พบสูตรอาหารนี้' });
    }

    // ตรวจสอบว่า user like แล้วหรือยัง (ถ้ามี userId)
    let isLiked = false;
    if (userId) {
      const { data: likeData, error: likeErr } = await supabase
        .from('UserRecipeLike')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
        .limit(1);
      
      if (!likeErr && likeData && likeData.length > 0) {
        isLiked = true;
      }
    }

    // Format response เพื่อให้ compatible กับ Frontend
    const formattedRecipe = {
      recipe_id: recipe.recipe_id,
      recipe_title: recipe.recipe_title,
      recipe_summary: recipe.recipe_summary,
      recipe_category: recipe.recipe_category,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      total_time_minutes: recipe.total_time_minutes,
      servings: recipe.servings,
      ingredients: parseJsonValue(recipe.ingredients) || [],
      steps: parseJsonValue(recipe.steps) || [],
      recipe_image: recipe.recipe_image,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      user_id: recipe.user_id,
      user_fname: recipe.User?.user_fname || 'Unknown',
      user_lname: recipe.User?.user_lname || '',
      like_count: recipe.like_count || 0,
      isLiked: isLiked
    };

    res.json(formattedRecipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสูตรอาหาร' });
  }
});

// GET /api/recipes - ดึงข้อมูลสูตรอาหารทั้งหมด (จาก UserRecipe)
router.get('/recipes', optionalAuth, async (req, res) => {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    const userId = req.user?.id; // Optional: สำหรับตรวจสอบว่า user like แล้วหรือยัง

    // ดึงสูตรอาหารทั้งหมดจาก UserRecipe
    const { data: recipes, error } = await supabase
      .from('UserRecipe')
      .select(`
        recipe_id,
        recipe_title,
        recipe_summary,
        recipe_category,
        prep_time_minutes,
        cook_time_minutes,
        total_time_minutes,
        servings,
        ingredients,
        steps,
        recipe_image,
        created_at,
        updated_at,
        user_id,
        like_count,
        User:user_id (user_fname, user_lname)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // ดึง like status สำหรับทุก recipe (ถ้ามี userId)
    const recipeIds = (recipes || []).map(r => r.recipe_id);
    let likedRecipes = new Set();
    if (userId && recipeIds.length > 0) {
      const { data: likes, error: likeErr } = await supabase
        .from('UserRecipeLike')
        .select('recipe_id')
        .eq('user_id', userId)
        .in('recipe_id', recipeIds);
      
      if (!likeErr && likes) {
        likedRecipes = new Set(likes.map(l => l.recipe_id));
      }
    }

    // แปลงข้อมูลให้ Frontend ใช้งานง่าย (เพื่อให้ compatible กับโค้ดเดิม)
    const formattedRecipes = (recipes || []).map(recipe => {
      return {
        recipe_id: recipe.recipe_id,
        cpost_id: recipe.recipe_id, // ใช้ recipe_id แทน cpost_id เพื่อความเข้ากันได้
        cpost_title: recipe.recipe_title,
        cpost_datetime: recipe.created_at,
        cpost_image: recipe.recipe_image,
        like_count: recipe.like_count || 0,
        isLiked: userId ? likedRecipes.has(recipe.recipe_id) : false,
        post_type: 'recipe',
        user_id: recipe.user_id,
        user_fname: recipe.User?.user_fname || 'Unknown',
        User: undefined,
        recipe: {
          recipe_id: recipe.recipe_id,
          recipe_summary: recipe.recipe_summary,
          recipe_category: recipe.recipe_category,
          prep_time_minutes: recipe.prep_time_minutes,
          cook_time_minutes: recipe.cook_time_minutes,
          total_time_minutes: recipe.total_time_minutes,
          servings: recipe.servings,
          ingredients: parseJsonValue(recipe.ingredients) || [],
          steps: parseJsonValue(recipe.steps) || []
        }
      };
    });

    res.json(formattedRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสูตรอาหาร' });
  }
});

// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด (เฉพาะโพสต์ปกติ ไม่รวมสูตรอาหาร)
router.get('/posts', async (req, res) => {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึงโพสต์ทั้งหมดพร้อมข้อมูลผู้ใช้ (เฉพาะโพสต์ปกติ ไม่รวมสูตรอาหาร)
    const { data: posts, error } = await supabase
      .from('CommunityPost')
      .select(`
        cpost_id, 
        cpost_title, 
        cpost_datetime, 
        cpost_image, 
        cpost_images,
        like_count, 
        post_type,
        user_id,
        cpost_content,
        User:user_id (user_fname, user_lname, user_image)
      `)
      .eq('post_type', 'post') // กรองเฉพาะโพสต์ปกติ
      .order('cpost_datetime', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // แปลงข้อมูลให้ Frontend ใช้งานง่าย
    const formattedPosts = (posts || []).map(post => {
      const images = parseImageList(post.cpost_images, post.cpost_image);
      return {
        ...post,
        cpost_images: images,
        cpost_image: images[0] || null,
        user_fname: post.User?.user_fname || 'Unknown',
        user_image: post.User?.user_image || null,
        User: undefined, // ลบ nested objectออก
        recipe: null // ไม่มี recipe สำหรับโพสต์ปกติ
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});

// GET /api/posts/:id - ดึงข้อมูลโพสต์เดียว (ต้อง Login เพื่อดูสถานะไลค์)
router.get('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const loggedInUserId = req.user.id; // ID ของผู้ใช้ที่กำลังดู

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึงข้อมูลโพสต์หลักพร้อมข้อมูลผู้ใช้
    const { data: posts, error: postErr } = await supabase
      .from('CommunityPost')
      .select(`
        *,
        User:user_id (user_fname, user_lname, user_image)
      `)
      .eq('cpost_id', postId)
      .limit(1);
    
    if (postErr) {
      console.error('Supabase query error:', postErr);
      throw postErr;
    }
    if (!posts || posts.length === 0) return res.status(404).json({ message: 'ไม่พบโพสต์' });

    // ดึงคอมเมนต์พร้อมข้อมูลผู้ใช้
    const { data: comments, error: commentErr } = await supabase
      .from('CommunityComment')
      .select(`
        *,
        User:user_id (user_fname, user_lname)
      `)
      .eq('cpost_id', postId)
      .order('comment_datetime', { ascending: true });
    
    if (commentErr) {
      console.error('Supabase query error:', commentErr);
      throw commentErr;
    }

    // ตรวจสอบว่าผู้ใช้คนนี้เคยกดไลค์โพสต์นี้หรือยัง
    const { data: likes, error: likeErr } = await supabase
      .from('PostLike')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', loggedInUserId)
      .limit(1);
    
    if (likeErr) {
      console.error('Supabase query error:', likeErr);
      throw likeErr;
    }

    // แปลงข้อมูลคอมเมนต์
    const formattedComments = (comments || []).map(comment => ({
      ...comment,
      user_fname: comment.User?.user_fname || 'Unknown',
      user_image: comment.User?.user_image || null,
      comment_content: comment.comment_text, // เพิ่ม alias สำหรับ Frontend
      User: undefined // ลบ nested object ออก
    }));

    const basePost = posts[0];
    const normalizedImages = parseImageList(basePost.cpost_images, basePost.cpost_image);
    const postData = {
      ...basePost,
      cpost_images: normalizedImages,
      cpost_image: normalizedImages[0] || null,
      user_fname: basePost.User?.user_fname || 'Unknown',
      user_image: basePost.User?.user_image || null,
      User: undefined, // ลบ nested object ออก
      comments: formattedComments,
      isLiked: likes && likes.length > 0, // เพิ่ม key ใหม่: ถ้าเจอข้อมูลไลค์จะเป็น true
      recipe: null // ไม่มี recipe สำหรับโพสต์ปกติ
    };
    
    res.json(postData);
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});


// --- PROTECTED ROUTES ---

// POST /api/posts - สร้างโพสต์ใหม่พร้อมรูปภาพ (โพสต์ปกติ)
router.post('/posts', authMiddleware, ...upload.fields([
  { name: 'cpost_image', maxCount: 1 },
  { name: 'cpost_images', maxCount: 6 }
]), moderateContent, async (req, res) => {
  const { cpost_title, cpost_content } = req.body;
  const user_id = req.user.id;

  const finalTitle = (cpost_title || '').trim() || buildFallbackTitle(cpost_content);
  const uploadedImages = collectUploadedImages(req.files);
  if (req.file?.filename && !uploadedImages.includes(req.file.filename)) {
    uploadedImages.unshift(req.file.filename);
  }

  // ตรวจสอบว่า Supabase client พร้อมใช้งาน
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return res.status(500).json({ message: 'Database connection error' });
  }

  try {
    const newPost = {
      cpost_id: 'CP' + Date.now().toString(),
      cpost_title: finalTitle,
      cpost_content: cpost_content || null, // เนื้อหาเป็น optional
      post_type: 'post',
      user_id,
      cpost_datetime: new Date().toISOString(),
      cpost_image: uploadedImages[0] || null,
      cpost_images: uploadedImages,
      like_count: 0
    };

    const { data, error } = await supabase.from('CommunityPost').insert([newPost]).select();
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log(`Post created successfully: ${newPost.cpost_id}`);
    
    const createdPost = data?.[0] || newPost;
    const normalizedImages = parseImageList(createdPost?.cpost_images, createdPost?.cpost_image);
    const response = {
      message: 'สร้างโพสต์สำเร็จ',
      post: {
        ...createdPost,
        cpost_images: normalizedImages,
        cpost_image: normalizedImages[0] || null
      }
    };
    if (req.moderationWarning) {
      response.warning = req.moderationWarning;
    }
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างโพสต์' });
  }
});

// POST /api/posts/:id/comments - เพิ่มความคิดเห็นในโพสต์
router.post('/posts/:id/comments', authMiddleware, moderateContent, async (req, res) => {
    const { id: cpost_id } = req.params;
    const { comment_content } = req.body;
    const user_id = req.user.id;
  
    if (!comment_content) {
      return res.status(400).json({ message: 'กรุณากรอกความคิดเห็น' });
    }

    // ตรวจสอบว่า Supabase client พร้อมใช้งาน
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    try {
      // ดึงข้อมูลโพสต์เพื่อหาเจ้าของโพสต์
      const { data: posts, error: postErr } = await supabase
        .from('CommunityPost')
        .select('user_id, cpost_title')
        .eq('cpost_id', cpost_id)
        .limit(1);

      if (postErr) {
        console.error('Supabase query error:', postErr);
        throw postErr;
      }

      if (!posts || posts.length === 0) {
        return res.status(404).json({ message: 'ไม่พบโพสต์' });
      }

      const postOwnerId = posts[0].user_id;
      const postTitle = posts[0].cpost_title;

      // ดึงข้อมูลผู้ที่คอมเมนต์
      const { data: commenter, error: commenterErr } = await supabase
        .from('User')
        .select('user_fname')
        .eq('user_id', user_id)
        .limit(1);

      const commenterName = commenter && commenter[0] ? commenter[0].user_fname : 'Someone';

      const newComment = {
        comment_id: 'CM' + Date.now().toString(),
        comment_text: comment_content,
        cpost_id,
        user_id,
        comment_datetime: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('CommunityComment')
        .insert([newComment])
        .select();
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      console.log(`Comment created successfully: ${newComment.comment_id}`);

      // สร้าง notification สำหรับเจ้าของโพสต์ (ถ้าไม่ใช่เจ้าของโพสต์เอง)
      if (postOwnerId !== user_id) {
        await createNotification({
          notification_type: 'comment',
          notification_message: `${commenterName} แสดงความคิดเห็นในโพสต์ของคุณ: "${postTitle}"`,
          user_id: postOwnerId,
          cpost_id: cpost_id,
          comment_id: newComment.comment_id,
          actor_user_id: user_id
        });
      }

      res.status(201).json(data && data[0] ? data[0] : newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น' });
    }
});
  
// PUT /api/posts/:id - แก้ไขโพสต์ (สำหรับเจ้าของโพสต์ หรือ Admin)
router.put('/posts/:id', authMiddleware, ...upload.fields([
  { name: 'cpost_image', maxCount: 1 },
  { name: 'cpost_images', maxCount: 6 }
]), async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { cpost_title, cpost_content, keep_images } = req.body;
    const loggedInUserId = req.user.id;
    const finalTitle = (cpost_title || '').trim() || buildFallbackTitle(cpost_content);

    // ตรวจสอบว่า Supabase client พร้อมใช้งาน
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึงข้อมูลโพสต์เพื่อตรวจสอบเจ้าของ
    const { data: posts, error: findErr } = await supabase
      .from('CommunityPost')
      .select('user_id, cpost_images, cpost_image')
      .eq('cpost_id', postId)
      .limit(1);
    
    if (findErr) {
      console.error('Supabase query error:', findErr);
      throw findErr;
    }
    
    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการแก้ไข' });
    }

    const postOwnerId = posts[0].user_id;
    const currentImages = parseImageList(posts[0].cpost_images, posts[0].cpost_image);

    // ตรวจสอบว่าเป็น Admin หรือไม่
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', loggedInUserId)
      .limit(1);
    
    if (adminErr) {
      console.error('Supabase query error:', adminErr);
      throw adminErr;
    }
    
    const isAdmin = !!(admins && admins.length > 0);

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของโพสต์หรือ Admin
    if (!isAdmin && loggedInUserId !== postOwnerId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' });
    }

    let keepImages = currentImages;
    if (keep_images) {
      try {
        const parsed = JSON.parse(keep_images);
        if (Array.isArray(parsed)) {
          keepImages = parsed.filter(Boolean);
        }
      } catch (err) {
        console.warn('Failed to parse keep_images payload', err);
      }
    }

    const uploadedImages = collectUploadedImages(req.files);
    if (req.file?.filename && !uploadedImages.includes(req.file.filename)) {
      uploadedImages.unshift(req.file.filename);
    }

    const combinedImages = [...keepImages, ...uploadedImages].filter(Boolean);

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {
      cpost_title: finalTitle,
      cpost_content: cpost_content || null,
      cpost_image: combinedImages[0] || null,
      cpost_images: combinedImages
    };

    // อัปเดตโพสต์
    const { data: updatedPost, error: updErr } = await supabase
      .from('CommunityPost')
      .update(updateData)
      .eq('cpost_id', postId)
      .select();
    
    if (updErr) {
      console.error('Supabase update error:', updErr);
      throw updErr;
    }
    const updatedEntity = updatedPost?.[0];
    const normalizedImages = parseImageList(updatedEntity?.cpost_images, updatedEntity?.cpost_image);

    console.log(`Post updated successfully: ${postId}`);
    res.json({
      message: 'แก้ไขโพสต์สำเร็จ',
      post: {
        ...updatedEntity,
        cpost_images: normalizedImages,
        cpost_image: normalizedImages[0] || null
      }
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขโพสต์' });
  }
});

// POST /api/recipes - สร้างสูตรอาหารใหม่ (เก็บใน UserRecipe แทน CommunityPost)
router.post('/recipes', authMiddleware, ...upload.single('recipe_image'), moderateContent, async (req, res) => {
  const user_id = req.user.id;
  const {
    recipe_title,
    recipe_summary,
    recipe_category,
    prep_time_minutes,
    cook_time_minutes,
    total_time_minutes,
    servings,
    ingredients,
    steps
  } = req.body;

  if (!recipe_title) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อสูตรอาหาร' });
  }

  try {
    const parsedIngredients = typeof ingredients === 'string' ? parseJsonValue(ingredients) : ingredients;
    const parsedSteps = typeof steps === 'string' ? parseJsonValue(steps) : steps;

    if (!Array.isArray(parsedIngredients) || parsedIngredients.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุรายการวัตถุดิบอย่างน้อย 1 รายการ' });
    }

    if (!Array.isArray(parsedSteps) || parsedSteps.length === 0) {
      return res.status(400).json({ message: 'กรุณาระบุขั้นตอนการทำอาหาร' });
    }

    const recipeId = 'R' + Date.now().toString();

    // สร้างสูตรอาหารใน UserRecipe แทน CommunityPost
    const newRecipe = {
      recipe_id: recipeId,
      user_id,
      recipe_title,
      recipe_summary: recipe_summary || null,
      recipe_category: recipe_category || null,
      prep_time_minutes: prep_time_minutes ? Number(prep_time_minutes) : null,
      cook_time_minutes: cook_time_minutes ? Number(cook_time_minutes) : null,
      total_time_minutes: total_time_minutes ? Number(total_time_minutes) : null,
      servings: servings ? Number(servings) : null,
      ingredients: parsedIngredients,
      steps: parsedSteps,
      recipe_image: req.file ? req.file.filename : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('UserRecipe')
      .insert([newRecipe])
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log(`Recipe created successfully: ${recipeId}`);

    // Format response เพื่อให้ compatible กับ Frontend
    const recipeData = {
      recipe_id: recipeId,
      recipe_summary: recipe_summary || null,
      recipe_category: recipe_category || null,
      prep_time_minutes: prep_time_minutes ? Number(prep_time_minutes) : null,
      cook_time_minutes: cook_time_minutes ? Number(cook_time_minutes) : null,
      total_time_minutes: total_time_minutes ? Number(total_time_minutes) : null,
      servings: servings ? Number(servings) : null,
      ingredients: parsedIngredients,
      steps: parsedSteps
    };

    const response = {
      message: 'สร้างสูตรอาหารสำเร็จ',
      post: {
        recipe_id: recipeId,
        cpost_id: recipeId, // ใช้ recipe_id แทน cpost_id เพื่อความเข้ากันได้
        cpost_title: recipe_title,
        cpost_datetime: newRecipe.created_at,
        cpost_image: newRecipe.recipe_image,
        like_count: 0,
        post_type: 'recipe',
        user_id,
        recipe: recipeData
      }
    };

    if (req.moderationWarning) {
      response.warning = req.moderationWarning;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างสูตรอาหาร' });
  }
});

// PUT /api/recipes/:recipeId - แก้ไขสูตรอาหาร (เฉพาะเจ้าของสูตร)
router.put('/recipes/:recipeId', authMiddleware, ...upload.single('recipe_image'), moderateContent, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const user_id = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    const { data: existingRecipe, error: findErr } = await supabase
      .from('UserRecipe')
      .select('*')
      .eq('recipe_id', recipeId)
      .single();

    if (findErr || !existingRecipe) {
      return res.status(404).json({ message: 'ไม่พบสูตรอาหารนี้' });
    }

    if (existingRecipe.user_id !== user_id) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขสูตรอาหารนี้' });
    }

    const {
      recipe_title,
      recipe_summary,
      recipe_category,
      prep_time_minutes,
      cook_time_minutes,
      total_time_minutes,
      servings,
      ingredients,
      steps
    } = req.body;

    const parsedIngredients = ingredients !== undefined
      ? (typeof ingredients === 'string' ? parseJsonValue(ingredients) : ingredients)
      : undefined;
    const parsedSteps = steps !== undefined
      ? (typeof steps === 'string' ? parseJsonValue(steps) : steps)
      : undefined;

    if (parsedIngredients !== undefined) {
      if (!Array.isArray(parsedIngredients) || parsedIngredients.length === 0) {
        return res.status(400).json({ message: 'กรุณาระบุรายการวัตถุดิบอย่างน้อย 1 รายการ' });
      }
    }

    if (parsedSteps !== undefined) {
      if (!Array.isArray(parsedSteps) || parsedSteps.length === 0) {
        return res.status(400).json({ message: 'กรุณาระบุขั้นตอนการทำอาหารอย่างน้อย 1 ขั้นตอน' });
      }
    }

    const normalizeText = (value, fallback) => {
      if (value === undefined) return fallback;
      const trimmed = typeof value === 'string' ? value.trim() : value;
      return trimmed === '' ? null : trimmed;
    };

    const normalizeNumber = (value, fallback) => {
      if (value === undefined) return fallback;
      if (value === '' || value === null) return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const updatePayload = {
      recipe_title: normalizeText(recipe_title, existingRecipe.recipe_title),
      recipe_summary: normalizeText(recipe_summary, existingRecipe.recipe_summary),
      recipe_category: normalizeText(recipe_category, existingRecipe.recipe_category),
      prep_time_minutes: normalizeNumber(prep_time_minutes, existingRecipe.prep_time_minutes),
      cook_time_minutes: normalizeNumber(cook_time_minutes, existingRecipe.cook_time_minutes),
      total_time_minutes: normalizeNumber(total_time_minutes, existingRecipe.total_time_minutes),
      servings: normalizeNumber(servings, existingRecipe.servings),
      ingredients: parsedIngredients !== undefined ? parsedIngredients : existingRecipe.ingredients,
      steps: parsedSteps !== undefined ? parsedSteps : existingRecipe.steps,
      recipe_image: req.file ? req.file.filename : existingRecipe.recipe_image,
      updated_at: new Date().toISOString()
    };

    const { data: updated, error: updateErr } = await supabase
      .from('UserRecipe')
      .update(updatePayload)
      .eq('recipe_id', recipeId)
      .select();

    if (updateErr) {
      console.error('Supabase update error:', updateErr);
      throw updateErr;
    }

    const updatedRecipe = updated?.[0] || { ...existingRecipe, ...updatePayload };

    res.json({
      message: 'แก้ไขสูตรอาหารสำเร็จ',
      recipe: updatedRecipe,
      post: {
        recipe_id: recipeId,
        cpost_id: recipeId,
        cpost_title: updatedRecipe.recipe_title,
        cpost_datetime: updatedRecipe.updated_at,
        cpost_image: updatedRecipe.recipe_image,
        like_count: updatedRecipe.like_count || 0,
        post_type: 'recipe',
        user_id,
        recipe: {
          recipe_id: recipeId,
          recipe_summary: updatedRecipe.recipe_summary,
          recipe_category: updatedRecipe.recipe_category,
          prep_time_minutes: updatedRecipe.prep_time_minutes,
          cook_time_minutes: updatedRecipe.cook_time_minutes,
          total_time_minutes: updatedRecipe.total_time_minutes,
          servings: updatedRecipe.servings,
          ingredients: updatedRecipe.ingredients,
          steps: updatedRecipe.steps
        }
      }
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขสูตรอาหาร' });
  }
});

// POST /api/recipes/:recipeId/like - toggle like สูตรอาหารจากผู้ใช้
router.post('/recipes/:recipeId/like', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const userId = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ตรวจสอบว่าสูตรอาหารมีอยู่จริง
    const { data: recipe, error: recipeErr } = await supabase
      .from('UserRecipe')
      .select('recipe_id, like_count')
      .eq('recipe_id', recipeId)
      .single();

    if (recipeErr || !recipe) {
      return res.status(404).json({ message: 'ไม่พบสูตรอาหารนี้' });
    }

    // ตรวจสอบว่า like อยู่แล้วหรือยัง
    const { data: existingLike, error: likeErr } = await supabase
      .from('UserRecipeLike')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', userId)
      .limit(1);

    if (likeErr) {
      console.error('Error checking like:', likeErr);
      throw likeErr;
    }

    let newCount = recipe.like_count || 0;
    let liked = false;

    if (existingLike && existingLike.length > 0) {
      // Unlike: ลบ like
      const { error: deleteErr } = await supabase
        .from('UserRecipeLike')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId);

      if (deleteErr) {
        console.error('Error deleting like:', deleteErr);
        throw deleteErr;
      }

      newCount = Math.max(0, newCount - 1);
    } else {
      // Like: เพิ่ม like
      const { error: insertErr } = await supabase
        .from('UserRecipeLike')
        .insert([{ recipe_id: recipeId, user_id: userId }]);

      if (insertErr) {
        console.error('Error inserting like:', insertErr);
        throw insertErr;
      }

      newCount += 1;
      liked = true;

      // สร้าง notification สำหรับเจ้าของสูตร (ถ้าไม่ใช่เจ้าของเอง)
      const { data: recipeOwner, error: ownerErr } = await supabase
        .from('UserRecipe')
        .select('user_id, recipe_title')
        .eq('recipe_id', recipeId)
        .single();

      if (!ownerErr && recipeOwner && recipeOwner.user_id !== userId) {
        const { data: liker, error: likerErr } = await supabase
          .from('User')
          .select('user_fname')
          .eq('user_id', userId)
          .single();

        const likerName = liker?.user_fname || 'Someone';
        await createNotification({
          notification_type: 'like_recipe',
          notification_message: `${likerName} ชื่นชอบสูตรอาหารของคุณ: "${recipeOwner.recipe_title}"`,
          user_id: recipeOwner.user_id,
          actor_user_id: userId,
          recipe_id: recipeId
        });
      }
    }

    // อัปเดต like_count ใน UserRecipe
    const { error: updateErr } = await supabase
      .from('UserRecipe')
      .update({ like_count: newCount })
      .eq('recipe_id', recipeId);

    if (updateErr) {
      console.error('Error updating like count:', updateErr);
      throw updateErr;
    }

    res.json({ like_count: newCount, liked });
  } catch (error) {
    console.error('Error toggling recipe like:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการกดไลค์สูตรอาหาร' });
  }
});

// DELETE /api/recipes/:recipeId - ลบสูตรอาหาร (สำหรับเจ้าของสูตรเท่านั้น)
router.delete('/recipes/:recipeId', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const loggedInUserId = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ตรวจสอบว่าสูตรอาหารมีอยู่จริงและเป็นเจ้าของ
    const { data: recipe, error: findErr } = await supabase
      .from('UserRecipe')
      .select('user_id, recipe_title')
      .eq('recipe_id', recipeId)
      .single();

    if (findErr || !recipe) {
      return res.status(404).json({ message: 'ไม่พบสูตรอาหารนี้' });
    }

    // ตรวจสอบว่าเป็นเจ้าของสูตรหรือไม่
    if (recipe.user_id !== loggedInUserId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบสูตรอาหารนี้' });
    }

    // ลบสูตรอาหาร
    const { error: delErr } = await supabase
      .from('UserRecipe')
      .delete()
      .eq('recipe_id', recipeId);

    if (delErr) {
      console.error('Supabase delete error:', delErr);
      throw delErr;
    }

    console.log(`Recipe deleted successfully: ${recipeId}`);
    res.json({ message: 'ลบสูตรอาหารสำเร็จ' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบสูตรอาหาร' });
  }
});

// DELETE /api/posts/:id - ลบโพสต์ (สำหรับเจ้าของโพสต์ หรือ Admin)
router.delete('/posts/:id', authMiddleware, async (req, res) => {
    try {
      const loggedInUserId = req.user.id;
      const { id: postIdToDelete } = req.params;

      const { data: posts, error: findErr } = await supabase
        .from('CommunityPost')
        .select('user_id')
        .eq('cpost_id', postIdToDelete)
        .limit(1);
      if (findErr) throw findErr;
      if (!posts || posts.length === 0) return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการลบ' });
      const postOwnerId = posts[0].user_id;

      const { data: admins, error: adminErr } = await supabase
        .from('Admin')
        .select('admin_id')
        .eq('admin_id', loggedInUserId)
        .limit(1);
      if (adminErr) throw adminErr;
      const isAdmin = !!(admins && admins.length > 0);

      if (!isAdmin && loggedInUserId !== postOwnerId) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });
      }

      const { error: delCommentsErr } = await supabase
        .from('CommunityComment')
        .delete()
        .eq('cpost_id', postIdToDelete);
      if (delCommentsErr) throw delCommentsErr;

      const { error: delPostErr } = await supabase
        .from('CommunityPost')
        .delete()
        .eq('cpost_id', postIdToDelete);
      if (delPostErr) throw delPostErr;

      res.json({ message: 'ลบโพสต์สำเร็จ' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบโพสต์' });
    }
});

// DELETE /api/posts/comments/:id - ลบคอมเมนต์ (เจ้าของคอมเมนต์หรือ Admin)
router.delete('/posts/comments/:id', authMiddleware, async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const loggedInUserId = req.user.id;

    // ตรวจสอบว่า Supabase client พร้อมใช้งาน
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึงข้อมูลคอมเมนต์เพื่อตรวจสอบเจ้าของ
    const { data: comments, error: findErr } = await supabase
      .from('CommunityComment')
      .select('user_id')
      .eq('comment_id', commentId)
      .limit(1);
    
    if (findErr) {
      console.error('Supabase query error:', findErr);
      throw findErr;
    }
    
    if (!comments || comments.length === 0) {
      return res.status(404).json({ message: 'ไม่พบความคิดเห็นที่ต้องการลบ' });
    }

    const commentOwnerId = comments[0].user_id;

    // ตรวจสอบว่าเป็น Admin หรือไม่
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', loggedInUserId)
      .limit(1);
    
    if (adminErr) {
      console.error('Supabase query error:', adminErr);
      throw adminErr;
    }
    
    const isAdmin = !!(admins && admins.length > 0);

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของคอมเมนต์หรือ Admin
    if (!isAdmin && loggedInUserId !== commentOwnerId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบความคิดเห็นนี้' });
    }

    // ลบคอมเมนต์
    const { error: delErr } = await supabase
      .from('CommunityComment')
      .delete()
      .eq('comment_id', commentId);
    
    if (delErr) {
      console.error('Supabase delete error:', delErr);
      throw delErr;
    }

    console.log(`Comment deleted successfully: ${commentId}`);
    res.json({ message: 'ลบความคิดเห็นสำเร็จ' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบความคิดเห็น' });
  }
});

// POST /api/posts/:id/like - สำหรับกดไลค์/ยกเลิกไลค์
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
    const { id: postId } = req.params;
    const userId = req.user.id;

    try {
      const { data: likes, error: likeFindErr } = await supabase
        .from('PostLike')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .limit(1);
      if (likeFindErr) throw likeFindErr;

      // ดึงข้อมูลโพสต์เพื่อหาเจ้าของโพสต์
      const { data: postData, error: postErr } = await supabase
        .from('CommunityPost')
        .select('user_id, cpost_title, like_count')
        .eq('cpost_id', postId)
        .limit(1);

      if (postErr) throw postErr;
      if (!postData || postData.length === 0) {
        return res.status(404).json({ message: 'ไม่พบโพสต์' });
      }

      const postOwnerId = postData[0].user_id;
      const postTitle = postData[0].cpost_title;

      // ดึงข้อมูลผู้ที่ไลค์
      const { data: liker, error: likerErr } = await supabase
        .from('User')
        .select('user_fname')
        .eq('user_id', userId)
        .limit(1);

      const likerName = liker && liker[0] ? liker[0].user_fname : 'Someone';

      if (likes && likes.length > 0) {
        // ยกเลิกไลค์
        const { error: delErr } = await supabase
          .from('PostLike')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (delErr) throw delErr;
        // decrement like_count
        const newCount = Math.max(0, (postData[0].like_count || 0) - 1);
        await supabase
          .from('CommunityPost')
          .update({ like_count: newCount })
          .eq('cpost_id', postId);
        res.json({ message: 'ยกเลิกไลค์สำเร็จ', liked: false });
      } else {
        // กดไลค์
        const { error: insErr } = await supabase.from('PostLike').insert([{ post_id: postId, user_id: userId }]);
        if (insErr) throw insErr;
        const newCount = (postData[0].like_count || 0) + 1;
        await supabase
          .from('CommunityPost')
          .update({ like_count: newCount })
          .eq('cpost_id', postId);

        // สร้าง notification สำหรับเจ้าของโพสต์ (ถ้าไม่ใช่เจ้าของโพสต์เอง)
        if (postOwnerId !== userId) {
          await createNotification({
            notification_type: 'like_post',
            notification_message: `${likerName} ถูกใจโพสต์ของคุณ: "${postTitle}"`,
            user_id: postOwnerId,
            cpost_id: postId,
            actor_user_id: userId
          });
        }

        res.json({ message: 'ไลค์สำเร็จ', liked: true });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});


module.exports = router;