const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// สร้าง API Endpoint สำหรับลบคอมเมนต์โดย Admin
// DELETE /api/admin/comments/:id
router.delete('/admin/comments/:id', authMiddleware, async (req, res) => {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    // 2. ดึง ID ของคอมเมนต์ที่จะลบจาก URL (params)
    const { id: commentId } = req.params;

    // 3. เขียนคำสั่ง SQL DELETE
    const deleteSql = 'DELETE FROM CommunityComment WHERE comment_id = ?';
    const [result] = await db.query(deleteSql, [commentId]);

    // ตรวจสอบว่ามีการลบเกิดขึ้นจริงหรือไม่
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบความคิดเห็นที่ต้องการลบ' });
    }

    res.json({ message: 'ลบความคิดเห็นสำเร็จ' });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบความคิดเห็น' });
  }
});

// สร้าง API Endpoint สำหรับลบผู้ใช้โดย Admin
// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', authMiddleware, async (req, res) => {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    // 2. ดึง ID ของ user ที่จะลบจาก URL (params)
    const { id: userIdToDelete } = req.params;

    // 3. (Safety Check) ป้องกันไม่ให้ Admin ลบตัวเอง
    if (adminId === userIdToDelete) {
      return res.status(400).json({ message: 'ผู้ดูแลระบบไม่สามารถลบตัวเองได้' });
    }

    // 4. เขียนคำสั่ง SQL DELETE
    const deleteSql = 'DELETE FROM User WHERE user_id = ?';
    const [result] = await db.query(deleteSql, [userIdToDelete]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
    }

    res.json({ message: 'ลบผู้ใช้สำเร็จ' });

  } catch (error) {
    // 5. จัดการกับ Foreign Key Constraint Error
    // จะเกิดขึ้นเมื่อพยายามลบ User ที่ยังมีข้อมูลโพสต์หรือคอมเมนต์อยู่
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'ไม่สามารถลบผู้ใช้นี้ได้ เนื่องจากยังมีข้อมูลอื่น (เช่น โพสต์ หรือคอมเมนต์) ที่ผู้ใช้นี้สร้างไว้' });
    }
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
  }
});

// สร้าง API Endpoint สำหรับให้ Admin ดึงข้อมูลรายงานทั้งหมด
// GET /api/admin/reports
router.get('/admin/reports', authMiddleware, async (req, res) => {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    // 2. เขียนคำสั่ง SQL เพื่อดึงข้อมูลรายงานทั้งหมด พร้อมข้อมูลที่เกี่ยวข้อง
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

module.exports = router;