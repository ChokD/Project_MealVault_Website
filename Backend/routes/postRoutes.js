const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- PUBLIC ROUTES ---

// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด (รวมข้อมูลผู้ใช้)
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
        user_id,
        User:user_id (user_fname, user_lname)
      `)
      .order('cpost_datetime', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // แปลงข้อมูลให้ Frontend ใช้งานง่าย
    const formattedPosts = (posts || []).map(post => ({
      ...post,
      user_fname: post.User?.user_fname || 'Unknown',
      User: undefined // ลบ nested object ออก
    }));

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
        User:user_id (user_fname, user_lname)
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

    const postData = {
      ...posts[0],
      user_fname: posts[0].User?.user_fname || 'Unknown',
      User: undefined, // ลบ nested object ออก
      comments: formattedComments,
      isLiked: likes && likes.length > 0 // เพิ่ม key ใหม่: ถ้าเจอข้อมูลไลค์จะเป็น true
    };
    
    res.json(postData);
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});


// --- PROTECTED ROUTES ---

// POST /api/posts - สร้างโพสต์ใหม่พร้อมรูปภาพ
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
      res.status(201).json(data && data[0] ? data[0] : newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น' });
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

      if (likes && likes.length > 0) {
        const { error: delErr } = await supabase
          .from('PostLike')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (delErr) throw delErr;
        // decrement like_count
        await supabase
          .from('CommunityPost')
          .update({ like_count: supabase.rpc })
        // fallback manual fetch and update
        const { data: postRow } = await supabase
          .from('CommunityPost')
          .select('like_count')
          .eq('cpost_id', postId)
          .limit(1);
        const newCount = Math.max(0, ((postRow && postRow[0] && postRow[0].like_count) || 0) - 1);
        await supabase
          .from('CommunityPost')
          .update({ like_count: newCount })
          .eq('cpost_id', postId);
        res.json({ message: 'ยกเลิกไลค์สำเร็จ', liked: false });
      } else {
        const { error: insErr } = await supabase.from('PostLike').insert([{ post_id: postId, user_id: userId }]);
        if (insErr) throw insErr;
        const { data: postRow } = await supabase
          .from('CommunityPost')
          .select('like_count')
          .eq('cpost_id', postId)
          .limit(1);
        const newCount = ((postRow && postRow[0] && postRow[0].like_count) || 0) + 1;
        await supabase
          .from('CommunityPost')
          .update({ like_count: newCount })
          .eq('cpost_id', postId);
        res.json({ message: 'ไลค์สำเร็จ', liked: true });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});


module.exports = router;