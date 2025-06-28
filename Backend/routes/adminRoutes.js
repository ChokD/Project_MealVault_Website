const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// --- Middleware: สำหรับตรวจสอบสิทธิ์ความเป็น Admin ---
const checkAdmin = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
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
    const reportsSql = `
      SELECT
        r.creport_id,
        r.creport_reason,
        r.creport_datetime,
        p.cpost_id,
        p.cpost_title,
        u.user_id AS reporter_id,
        u.user_fname AS reporter_name
      FROM CommunityReport AS r
      JOIN CommunityPost AS p ON r.cpost_id = p.cpost_id
      JOIN User AS u ON r.user_id = u.user_id
      ORDER BY r.creport_datetime DESC
    `;
    const [reports] = await db.query(reportsSql);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' });
  }
});

// DELETE /api/admin/posts/:id - ลบโพสต์โดย Admin
router.delete('/admin/posts/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
      const { id: postId } = req.params;
  
      // ลบคอมเมนต์ทั้งหมดที่อยู่ในโพสต์นี้ก่อน
      await db.query('DELETE FROM CommunityComment WHERE cpost_id = ?', [postId]);
      // ลบไลค์ทั้งหมดที่อยู่ในโพสต์นี้ก่อน
      await db.query('DELETE FROM PostLike WHERE post_id = ?', [postId]);
      // ลบโพสต์หลัก
      const [result] = await db.query('DELETE FROM CommunityPost WHERE cpost_id = ?', [postId]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการลบ' });
      }
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

    // ก่อนลบ ให้ไปลดค่า like_count ในโพสต์ที่เกี่ยวข้องก่อน (ถ้ามีระบบไลค์คอมเมนต์)
    // ในที่นี้เราจะลบเลย
    const [result] = await db.query('DELETE FROM CommunityComment WHERE comment_id = ?', [commentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบความคิดเห็นที่ต้องการลบ' });
    }
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
    
        // ป้องกันไม่ให้ Admin ลบตัวเอง
        if (adminId === userIdToDelete) {
          return res.status(400).json({ message: 'ผู้ดูแลระบบไม่สามารถลบตัวเองได้' });
        }

        // ที่นี่ควรจะมีการจัดการที่ซับซ้อน เช่น ลบโพสต์, คอมเมนต์, ไลค์ ของผู้ใช้คนนี้ก่อน
        // แต่วิธีที่ง่ายที่สุดคือปล่อยให้ Foreign Key Constraint (ON DELETE CASCADE) จัดการ
        
        const [result] = await db.query('DELETE FROM User WHERE user_id = ?', [userIdToDelete]);
    
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
        }
    
        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'ไม่สามารถลบผู้ใช้นี้ได้ เพราะยังเป็น Admin หรือมีข้อมูลอื่นค้างอยู่' });
        }
        console.error('Error deleting user by admin:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
    }
});


module.exports = router;