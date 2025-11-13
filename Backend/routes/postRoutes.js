const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createNotification } = require('./notificationRoutes');

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

// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด (รวมข้อมูลผู้ใช้และสูตรอาหาร)
router.get('/posts', async (req, res) => {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึงโพสต์ทั้งหมดพร้อมข้อมูลผู้ใช้
    const { data: posts, error } = await supabase
      .from('CommunityPost')
      .select(`
        cpost_id, 
        cpost_title, 
        cpost_datetime, 
        cpost_image, 
        like_count, 
        post_type,
        user_id,
        User:user_id (user_fname, user_lname),
        CommunityRecipe (
          recipe_id,
          recipe_summary,
          recipe_category,
          prep_time_minutes,
          cook_time_minutes,
          total_time_minutes,
          servings,
          ingredients,
          steps
        )
      `)
      .order('cpost_datetime', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // แปลงข้อมูลให้ Frontend ใช้งานง่าย
    const formattedPosts = (posts || []).map(post => {
      const recipeData = Array.isArray(post.CommunityRecipe) ? post.CommunityRecipe[0] : post.CommunityRecipe;
      return {
        ...post,
        user_fname: post.User?.user_fname || 'Unknown',
        User: undefined, // ลบ nested object ออก
        recipe: recipeData
          ? {
              ...recipeData,
              ingredients: parseJsonValue(recipeData.ingredients) || [],
              steps: parseJsonValue(recipeData.steps) || []
            }
          : null,
        CommunityRecipe: undefined
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
        User:user_id (user_fname, user_lname),
        CommunityRecipe (
          recipe_id,
          recipe_summary,
          recipe_category,
          prep_time_minutes,
          cook_time_minutes,
          total_time_minutes,
          servings,
          ingredients,
          steps
        )
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
      comment_content: comment.comment_text, // เพิ่ม alias สำหรับ Frontend
      User: undefined // ลบ nested object ออก
    }));

    const basePost = posts[0];
    const recipeData = Array.isArray(basePost.CommunityRecipe) ? basePost.CommunityRecipe[0] : basePost.CommunityRecipe;
    const postData = {
      ...basePost,
      user_fname: basePost.User?.user_fname || 'Unknown',
      User: undefined, // ลบ nested object ออก
      comments: formattedComments,
      isLiked: likes && likes.length > 0, // เพิ่ม key ใหม่: ถ้าเจอข้อมูลไลค์จะเป็น true
      recipe: recipeData
        ? {
            ...recipeData,
            ingredients: parseJsonValue(recipeData.ingredients) || [],
            steps: parseJsonValue(recipeData.steps) || []
          }
        : null,
      CommunityRecipe: undefined
    };
    
    res.json(postData);
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});


// --- PROTECTED ROUTES ---

// POST /api/posts - สร้างโพสต์ใหม่พร้อมรูปภาพ (โพสต์ปกติ)
router.post('/posts', authMiddleware, upload.single('cpost_image'), async (req, res) => {
  const { cpost_title, cpost_content } = req.body;
  const user_id = req.user.id;

  if (!cpost_title) {
    return res.status(400).json({ message: 'กรุณากรอกหัวข้อโพสต์' });
  }

  // ตรวจสอบว่า Supabase client พร้อมใช้งาน
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return res.status(500).json({ message: 'Database connection error' });
  }

  try {
    const newPost = {
      cpost_id: 'CP' + Date.now().toString(),
      cpost_title,
      cpost_content: cpost_content || null, // เนื้อหาเป็น optional
      post_type: 'post',
      user_id,
      cpost_datetime: new Date().toISOString(),
      cpost_image: req.file ? req.file.filename : null,
      like_count: 0
    };

    const { data, error } = await supabase.from('CommunityPost').insert([newPost]).select();
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log(`Post created successfully: ${newPost.cpost_id}`);
    res.status(201).json({ message: 'สร้างโพสต์สำเร็จ', post: data?.[0] || newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างโพสต์' });
  }
});

// POST /api/posts/:id/comments - เพิ่มความคิดเห็นในโพสต์
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
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
router.put('/posts/:id', authMiddleware, upload.single('cpost_image'), async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { cpost_title, cpost_content } = req.body;
    const loggedInUserId = req.user.id;

    // ตรวจสอบว่า Supabase client พร้อมใช้งาน
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    if (!cpost_title) {
      return res.status(400).json({ message: 'กรุณากรอกหัวข้อโพสต์' });
    }

    // ดึงข้อมูลโพสต์เพื่อตรวจสอบเจ้าของ
    const { data: posts, error: findErr } = await supabase
      .from('CommunityPost')
      .select('user_id')
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

    // เตรียมข้อมูลสำหรับอัปเดต
    const updateData = {
      cpost_title,
      cpost_content: cpost_content || null
    };

    // ถ้ามีการอัปโหลดรูปภาพใหม่ ให้เพิ่มเข้าไป
    if (req.file) {
      updateData.cpost_image = req.file.filename;
    }

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

    console.log(`Post updated successfully: ${postId}`);
    res.json({ message: 'แก้ไขโพสต์สำเร็จ', post: updatedPost?.[0] });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขโพสต์' });
  }
});

// POST /api/recipes - สร้างสูตรอาหารใหม่
router.post('/recipes', authMiddleware, upload.single('recipe_image'), async (req, res) => {
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

    const cpostId = 'CR' + Date.now().toString();
    const recipeId = 'R' + Date.now().toString();

    const newPost = {
      cpost_id: cpostId,
      cpost_title: recipe_title,
      cpost_content: recipe_summary || null,
      cpost_datetime: new Date().toISOString(),
      cpost_image: req.file ? req.file.filename : null,
      like_count: 0,
      user_id,
      post_type: 'recipe'
    };

    const { error: postErr } = await supabase.from('CommunityPost').insert([newPost]);
    if (postErr) throw postErr;

    const newRecipe = {
      recipe_id: recipeId,
      cpost_id: cpostId,
      recipe_summary: recipe_summary || null,
      recipe_category: recipe_category || null,
      prep_time_minutes: prep_time_minutes ? Number(prep_time_minutes) : null,
      cook_time_minutes: cook_time_minutes ? Number(cook_time_minutes) : null,
      total_time_minutes: total_time_minutes ? Number(total_time_minutes) : null,
      servings: servings ? Number(servings) : null,
      ingredients: parsedIngredients,
      steps: parsedSteps
    };

    const { error: recipeErr } = await supabase.from('CommunityRecipe').insert([newRecipe]);
    if (recipeErr) throw recipeErr;

    res.status(201).json({
      message: 'สร้างสูตรอาหารสำเร็จ',
      post: {
        ...newPost,
        recipe: {
          ...newRecipe,
          ingredients: parsedIngredients,
          steps: parsedSteps
        }
      }
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างสูตรอาหาร' });
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