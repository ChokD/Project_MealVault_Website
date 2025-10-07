const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// --- Middleware: สำหรับตรวจสอบสิทธิ์ความเป็น Admin ---
const checkAdmin = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('*')
      .eq('admin_id', adminId)
      .limit(1);
    if (adminErr) throw adminErr;
    if (!admins || admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }
    next(); // ถ้าเป็น Admin ให้ไปต่อ
  } catch (error) {
    console.error('Error in checkAdmin middleware:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
};

// --- Admin Routes ---
// ทุก Route ในไฟล์นี้จะถูกป้องกันด้วย authMiddleware และ checkAdmin

// GET /api/admin/reports - ดึงข้อมูลรายงานทั้งหมด
router.get('/admin/reports', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const { data: reports, error } = await supabase
      .from('CommunityReport')
      .select('creport_id, creport_reason, creport_datetime, cpost_id, user_id')
      .order('creport_datetime', { ascending: false });
    if (error) throw error;
    res.json(reports || []);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' });
  }
});

// DELETE /api/admin/posts/:id - ลบโพสต์โดย Admin
router.delete('/admin/posts/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
      const { id: postId } = req.params;

      const { error: delCommentsErr } = await supabase
        .from('CommunityComment')
        .delete()
        .eq('cpost_id', postId);
      if (delCommentsErr) throw delCommentsErr;

      const { error: delLikesErr } = await supabase
        .from('PostLike')
        .delete()
        .eq('post_id', postId);
      if (delLikesErr) throw delLikesErr;

      const { error: delPostErr } = await supabase
        .from('CommunityPost')
        .delete()
        .eq('cpost_id', postId);
      if (delPostErr) throw delPostErr;

      res.json({ message: 'ลบโพสต์สำเร็จ' });
    } catch (error) {
      console.error('Error deleting post by admin:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบโพสต์' });
    }
});

// DELETE /api/admin/comments/:id - ลบคอมเมนต์โดย Admin
router.delete('/admin/comments/:id', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { error } = await supabase
      .from('CommunityComment')
      .delete()
      .eq('comment_id', commentId);
    if (error) throw error;
    res.json({ message: 'ลบความคิดเห็นสำเร็จ' });
  } catch (error) {
    console.error('Error deleting comment by admin:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบความคิดเห็น' });
  }
});

// DELETE /api/admin/users/:id - ลบผู้ใช้โดย Admin
router.delete('/admin/users/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id: userIdToDelete } = req.params;

        if (adminId === userIdToDelete) {
          return res.status(400).json({ message: 'ผู้ดูแลระบบไม่สามารถลบตัวเองได้' });
        }

        const { error } = await supabase
          .from('User')
          .delete()
          .eq('user_id', userIdToDelete);
        if (error) throw error;

        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error('Error deleting user by admin:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
    }
});


module.exports = router;