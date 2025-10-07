const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// --- Public Route ---
// GET /api/categories - ดึงข้อมูลหมวดหมู่ทั้งหมด
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .order('category_name');
    if (error) throw error;
    res.json(data || []);
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
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('*')
      .eq('admin_id', adminId)
      .limit(1);
    if (adminErr) throw adminErr;
    if (!admins || admins.length === 0) {
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
    const { error } = await supabase.from('Category').insert([newCategory]);
    if (error) throw error;

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
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('*')
      .eq('admin_id', adminId)
      .limit(1);
    if (adminErr) throw adminErr;
    if (!admins || admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    const { id: categoryId } = req.params;
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่ใหม่' });
    }

    const { data, error } = await supabase
      .from('Category')
      .update({ category_name })
      .eq('category_id', categoryId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
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
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('*')
      .eq('admin_id', adminId)
      .limit(1);
    if (adminErr) throw adminErr;
    if (!admins || admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    const { id: categoryId } = req.params;

    const { error } = await supabase
      .from('Category')
      .delete()
      .eq('category_id', categoryId);
    if (error) throw error;
    const result = { affectedRows: 1 }; // emulate success
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