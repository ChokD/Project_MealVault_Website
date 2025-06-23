const authMiddleware = require('../middleware/authMiddleware'); 
const express = require('express');
const router = express.Router();
const db = require('../config/db');


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

    // 3. เขียนคำสั่ง SQL เพื่อค้นหา
    const sql = 'SELECT * FROM Menu WHERE menu_name LIKE ?';
    const [menus] = await db.query(sql, [searchTerm]);

    res.json(menus);

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
    // ใช้ LEFT JOIN เพื่อดึงชื่อผู้สร้างเมนูมาด้วย (ถ้ามี)
    const sql = `
      SELECT 
        Menu.*, 
        User.user_fname 
      FROM 
        Menu 
      LEFT JOIN User ON Menu.user_id = User.user_id
      ORDER BY 
        menu_datetime DESC
    `;
    const [menus] = await db.query(sql);

    res.json(menus); // ส่งข้อมูลเมนูทั้งหมดกลับไป

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
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    // ถ้าไม่พบ user คนนี้ในตาราง Admin ให้ปฏิเสธการเข้าถึง
    if (admins.length === 0) {
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

    const insertSql = 'INSERT INTO Menu SET ?';
    await db.query(insertSql, newMenu);

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
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
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
    const updateSql = `
      UPDATE Menu 
      SET menu_name = ?, menu_description = ?, menu_recipe = ?, menu_image = ?, category_id = ? 
      WHERE menu_id = ?
    `;
    const [result] = await db.query(updateSql, [menu_name, menu_description, menu_recipe, menu_image, category_id, menuId]);

    // ตรวจสอบว่ามีการอัปเดตเกิดขึ้นจริงหรือไม่
    if (result.affectedRows === 0) {
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
    const adminSql = 'SELECT * FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [adminId]);

    if (admins.length === 0) {
      return res.status(403).json({ message: 'การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบเท่านั้น' });
    }

    // 2. ดึง ID ของเมนูที่จะลบจาก URL (params)
    const { id: menuId } = req.params;

    // 3. เขียนคำสั่ง SQL DELETE
    const deleteSql = 'DELETE FROM Menu WHERE menu_id = ?';
    const [result] = await db.query(deleteSql, [menuId]);

    // ตรวจสอบว่ามีการลบเกิดขึ้นจริงหรือไม่ (ถ้าใส่ ID ที่ไม่มีอยู่จริง affectedRows จะเป็น 0)
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