const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// --- Public Route ---
// GET /api/categories - ดึงข้อมูลหมวดหมู่ทั้งหมด
router.get('/categories', async (req, res) => {
  try {
    const sql = 'SELECT * FROM Category ORDER BY category_name';
    const [categories] = await db.query(sql);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่' });
  }
});

// --- Admin-Only Routes ---

// POST /api/categories - เพิ่มหมวดหมู่ใหม่
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่' });
    }

    const newCategory = {
      category_id: 'C' + Date.now().toString().slice(-6),
      category_name
    };
    const insertSql = 'INSERT INTO Category SET ?';
    await db.query(insertSql, newCategory);

    res.status(201).json({ message: 'เพิ่มหมวดหมู่สำเร็จ', data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' });
  }
});

// PUT /api/categories/:id - แก้ไขชื่อหมวดหมู่
router.put('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    const { id: categoryId } = req.params;
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่ใหม่' });
    }

    const updateSql = 'UPDATE Category SET category_name = ? WHERE category_id = ?';
    const [result] = await db.query(updateSql, [category_name, categoryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });
    }

    res.json({ message: 'แก้ไขหมวดหมู่สำเร็จ' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่' });
  }
});

// DELETE /api/categories/:id - ลบหมวดหมู่
router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    const { id: categoryId } = req.params;

    const deleteSql = 'DELETE FROM Category WHERE category_id = ?';
    const [result] = await db.query(deleteSql, [categoryId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });
    }

    res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    // จัดการกับ Foreign Key Constraint Error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากมีเมนูอาหารใช้งานอยู่' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' });
  }
});

module.exports = router;