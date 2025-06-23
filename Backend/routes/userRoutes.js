// ที่ด้านบนสุดของไฟล์ routes/userRoutes.js
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <-- ให้มีบรรทัดนี้แค่ที่นี่ที่เดียว
const db = require('../config/db');
// สร้าง API Endpoint สำหรับการสมัครสมาชิก
// POST /api/register
router.post('/register', async (req, res) => {
  // ดึงข้อมูลจาก Request Body ที่ส่งมา
  const { user_email, user_fname, user_lname, user_password, user_tel } = req.body;

  // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบหรือไม่
  if (!user_email || !user_password || !user_fname) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  try {
    // เข้ารหัสรหัสผ่านก่อนบันทึก
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_password, salt);

    // เตรียมข้อมูลที่จะบันทึกลงฐานข้อมูล
    // อ้างอิงจากโครงสร้างตาราง User ของคุณ 
    const newUser = {
      user_id: 'U' + Date.now().toString().slice(-6), // <-- แก้ไขเป็นแบบนี้
      user_email,
      user_fname,
      user_lname,
      user_password: hashedPassword, // ใช้รหัสผ่านที่เข้ารหัสแล้ว
      user_tel
    };

    // เขียนคำสั่ง SQL เพื่อเพิ่มผู้ใช้ใหม่
    const sql = 'INSERT INTO User SET ?';
    await db.query(sql, newUser);

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

// ... (โค้ดของ router.post('/register', ...)) ...

// สร้าง API Endpoint สำหรับการเข้าสู่ระบบ
// POST /api/login
router.post('/login', async (req, res) => {
  // ดึง email และ password จาก Request Body
  const { user_email, user_password } = req.body;

  // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
  if (!user_email || !user_password) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  try {
    // 1. ค้นหาผู้ใช้จากอีเมลในฐานข้อมูล
    const sql = 'SELECT * FROM User WHERE user_email = ?';
    const [users] = await db.query(sql, [user_email]);

    // ตรวจสอบว่าเจอผู้ใช้หรือไม่
    if (users.length === 0) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];

    // 2. เปรียบเทียบรหัสผ่านที่ส่งมากับรหัสผ่านในฐานข้อมูล
    const isMatch = await bcrypt.compare(user_password, user.user_password);

    // ตรวจสอบว่ารหัสผ่านตรงกันหรือไม่
    if (!isMatch) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 3. ถ้ารหัสผ่านถูกต้อง ให้สร้าง JWT Token
    const payload = {
      user: {
        id: user.user_id,
        email: user.user_email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // <-- แก้กลับเป็นแบบนี้
      { expiresIn: '1h' }, // Token จะหมดอายุใน 1 ชั่วโมง
      (err, token) => {
        if (err) throw err;
        res.json({ token }); // ส่ง Token กลับไปให้ผู้ใช้
      }
    );

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});
// GET /api/me - เส้นทางที่ต้องยืนยันตัวตนเพื่อดึงข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', authMiddleware, async (req, res) => {
  // สังเกตว่าเราใส่ authMiddleware คั่นกลาง
  // ถ้า Token ถูกต้อง โค้ดส่วนนี้จึงจะทำงานได้
  // และเราสามารถเข้าถึงข้อมูลผู้ใช้ได้จาก req.user ที่ middleware เพิ่มให้
  try {
    // เราใช้ req.user.id ที่ได้มาจาก Token ในการค้นหาข้อมูล
    const sql = 'SELECT user_id, user_email, user_fname FROM User WHERE user_id = ?';
    const [users] = await db.query(sql, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
});


// สร้าง API Endpoint สำหรับให้ผู้ใช้เปลี่ยนรหัสผ่านของตัวเอง
// PUT /api/users/change-password (ต้องใช้ Token)
router.put('/users/change-password', authMiddleware, async (req, res) => {
  // 1. ดึงข้อมูลรหัสผ่านเก่าและใหม่ออกจาก Request Body
  const { oldPassword, newPassword } = req.body;

  // 2. ดึง user id จาก Token ที่ผ่าน "ด่านตรวจ" มาแล้ว
  const userId = req.user.id;

  // ตรวจสอบข้อมูลเบื้องต้น
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านเก่าและรหัสผ่านใหม่' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    // 3. ดึงข้อมูลผู้ใช้ปัจจุบันจากฐานข้อมูลเพื่อเอารหัสผ่านที่เข้ารหัสไว้มาเปรียบเทียบ
    const userSql = 'SELECT * FROM User WHERE user_id = ?';
    const [users] = await db.query(userSql, [userId]);
    const user = users[0];

    // 4. เปรียบเทียบรหัสผ่านเก่าที่ผู้ใช้ส่งมากับรหัสผ่านในฐานข้อมูล
    const isMatch = await bcrypt.compare(oldPassword, user.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    // 5. ถ้ารหัสผ่านเก่าถูกต้อง ให้เข้ารหัสรหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 6. อัปเดตรหัสผ่านใหม่ลงในฐานข้อมูล
    const updateSql = 'UPDATE User SET user_password = ? WHERE user_id = ?';
    await db.query(updateSql, [hashedNewPassword, userId]);

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});


module.exports = router;