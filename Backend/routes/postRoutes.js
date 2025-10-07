const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- PUBLIC ROUTES ---

// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด (เพิ่ม like_count)
router.get('/posts', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('CommunityPost')
      .select('cpost_id, cpost_title, cpost_datetime, cpost_image, like_count, user_id')
      .order('cpost_datetime', { ascending: false });
    if (error) throw error;
    // Note: user_fname join omitted; frontend can fetch separately or denormalize later
    res.json(posts || []);
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

    // ดึงข้อมูลโพสต์หลัก
    const { data: posts, error: postErr } = await supabase
      .from('CommunityPost')
      .select('*')
      .eq('cpost_id', postId)
      .limit(1);
    if (postErr) throw postErr;
    if (!posts || posts.length === 0) return res.status(404).json({ message: 'ไม่พบโพสต์' });

    // ดึงคอมเมนต์
    const { data: comments, error: commentErr } = await supabase
      .from('CommunityComment')
      .select('*')
      .eq('cpost_id', postId)
      .order('comment_datetime', { ascending: true });
    if (commentErr) throw commentErr;

    // ตรวจสอบว่าผู้ใช้คนนี้เคยกดไลค์โพสต์นี้หรือยัง
    const { data: likes, error: likeErr } = await supabase
      .from('PostLike')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', loggedInUserId)
      .limit(1);
    if (likeErr) throw likeErr;

    const postData = {
      ...posts[0],
      comments: comments,
      isLiked: likes.length > 0 // เพิ่ม key ใหม่: ถ้าเจอข้อมูลไลค์จะเป็น true
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
  const { cpost_title } = req.body;
  const user_id = req.user.id;

  if (!cpost_title || !cpost_content) {
    return res.status(400).json({ message: 'กรุณากรอกหัวข้อและเนื้อหา' });
  }

  try {
    const newPost = {
      cpost_title,
      user_id,
      cpost_datetime: new Date(),
      cpost_image: req.file ? req.file.filename : null,
    };

    const { error } = await supabase.from('CommunityPost').insert([newPost]);
    if (error) throw error;
    res.status(201).json({ message: 'สร้างโพสต์สำเร็จ' });
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
    try {
      const newComment = {
        comment_text: comment_content,
        cpost_id,
        user_id,
        comment_datetime: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('CommunityComment')
        .insert([newComment])
        .select();
      if (error) throw error;
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