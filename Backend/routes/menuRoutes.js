const authMiddleware = require('../middleware/authMiddleware'); 
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');


// สร้าง API Endpoint สำหรับค้นหาเมนูอาหาร
// GET /api/menus/search?q=keyword
router.get('/menus/search', async (req, res) => {
  try {
    // 1. ดึงคำค้นหา (keyword) จาก query string ของ URL
    const { q } = req.query;

    // ตรวจสอบว่ามีคำค้นหาหรือไม่
    if (!q) {
      return res.status(400).json({ message: 'กรุณาระบุคำค้นหา' });
    }

    // 2. สร้างคำค้นหาสำหรับ SQL โดยใช้ LIKE และเครื่องหมาย %
    // เครื่องหมาย % หมายถึง "ตัวอักษรอะไรก็ได้ จำนวนเท่าไหร่ก็ได้"
    // ดังนั้น '%ไข่%' จะหมายถึง ค้นหาคำที่มี "ไข่" อยู่ตรงไหนก็ได้ในชื่อ
    const searchTerm = `%${q}%`;
    const { data: menus, error } = await supabase
      .from('Menu')
      .select('*')
      .ilike('menu_name', searchTerm);
    if (error) throw error;
    res.json(menus || []);

  } catch (error) {
    console.error('Error searching menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาเมนู' });
  }
});


// ... (โค้ดของ router.get('/menus',...)) และอื่นๆ ที่มีอยู่แล้ว ...
// สร้าง API Endpoint สำหรับดึงข้อมูลเมนูทั้งหมด
// GET /api/menus (ทุกคนสามารถดูได้)
router.get('/menus', async (req, res) => {
  try {
    const { data: menus, error } = await supabase
      .from('Menu')
      .select('*')
      .order('menu_datetime', { ascending: false });
    if (error) throw error;
    res.json(menus || []);
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู' });
  }
});

// สร้าง API Endpoint สำหรับเพิ่มเมนูใหม่ (เฉพาะ Admin)
// POST /api/menus
router.post('/menus', authMiddleware, async (req, res) => {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin
    // ดึง user_id จาก Token ที่ผ่าน middleware มาแล้ว
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

    // 2. ถ้าเป็น Admin ให้ทำการเพิ่มเมนูใหม่
    const { menu_name, menu_description, menu_recipe, menu_image, category_id } = req.body;

    if (!menu_name || !menu_description || !menu_recipe) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลเมนูให้ครบถ้วน' });
    }

    const newMenu = {
      menu_id: 'M' + Date.now().toString().slice(-6), // สร้าง ID เมนูชั่วคราว
      menu_name,
      menu_description,
      menu_recipe,
      menu_image: menu_image || 'default.jpg', // ใส่รูปภาพ default ถ้าไม่มี
      menu_datetime: new Date(),
      user_id: adminId, // บันทึกว่า Admin คนไหนเป็นคนสร้าง
      category_id
    };

    const { error } = await supabase.from('Menu').insert([newMenu]);
    if (error) throw error;

    res.status(201).json({ message: 'เพิ่มเมนูใหม่สำเร็จ' });

  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างเมนู' });
  }
});

// สร้าง API Endpoint สำหรับแก้ไขเมนู (เฉพาะ Admin)
// PUT /api/menus/:id
router.put('/menus/:id', authMiddleware, async (req, res) => {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin (เหมือนเดิม)
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

    // 2. ดึง ID ของเมนูที่จะแก้ไขจาก URL (params)
    const { id: menuId } = req.params;

    // 3. ดึงข้อมูลใหม่ที่จะอัปเดตจาก Request Body
    const { menu_name, menu_description, menu_recipe, menu_image, category_id } = req.body;

    if (!menu_name || !menu_description || !menu_recipe) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลเมนูที่จำเป็นให้ครบถ้วน' });
    }

    // 4. เขียนคำสั่ง SQL UPDATE
    const { data, error } = await supabase
      .from('Menu')
      .update({ menu_name, menu_description, menu_recipe, menu_image, category_id })
      .eq('menu_id', menuId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'ไม่พบเมนูที่ต้องการแก้ไข' });
    }

    res.json({ message: 'แก้ไขเมนูสำเร็จ' });

  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขเมนู' });
  }
});

// สร้าง API Endpoint สำหรับลบเมนู (เฉพาะ Admin)
// DELETE /api/menus/:id
router.delete('/menus/:id', authMiddleware, async (req, res) => {
  try {
    // 1. ตรวจสอบสิทธิ์ Admin (ใช้โค้ดชุดเดียวกับตอน POST และ PUT)
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

    // 2. ดึง ID ของเมนูที่จะลบจาก URL (params)
    const { id: menuId } = req.params;

    // 3. เขียนคำสั่ง SQL DELETE
    const { error } = await supabase
      .from('Menu')
      .delete()
      .eq('menu_id', menuId);
    if (error) throw error;

    const result = { affectedRows: 1 };
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบเมนูที่ต้องการลบ' });
    }

    res.json({ message: 'ลบเมนูสำเร็จ' });

  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบเมนู' });
  }
});

module.exports = router;