// ที่ด้านบนสุดของไฟล์ routes/userRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../middleware/authMiddleware');

// --- AUTHENTICATION ROUTES ---

// POST /api/register - สมัครสมาชิก
router.post('/register', async (req, res) => {
  const { user_email, user_fname, user_lname, user_password, user_tel } = req.body;

  if (!user_email || !user_password || !user_fname) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_password, salt);

    const newUser = {
      user_id: 'U' + Date.now().toString().slice(-6),
      user_email,
      user_fname,
      user_lname,
      user_password: hashedPassword,
      user_tel
    };

    const sql = 'INSERT INTO User SET ?';
    await db.query(sql, newUser);

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

// POST /api/login - เข้าสู่ระบบ
router.post('/login', async (req, res) => {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  try {
    const sql = 'SELECT * FROM User WHERE user_email = ?';
    const [users] = await db.query(sql, [user_email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(user_password, user.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const payload = {
      user: {
        id: user.user_id,
        email: user.user_email
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});


// --- USER PROFILE ROUTES (Protected) ---

// GET /api/me - ดึงข้อมูลผู้ใช้ที่ Login อยู่
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const sql = 'SELECT user_id, user_email, user_fname, user_lname, user_tel FROM User WHERE user_id = ?';
    const [users] = await db.query(sql, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    
    // ตรวจสอบว่าเป็น Admin หรือไม่
    const adminSql = 'SELECT admin_id FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [req.user.id]);
    
    const userData = {
      ...users[0],
      isAdmin: admins.length > 0
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
});

// PUT /api/users/change-password - เปลี่ยนรหัสผ่านของตัวเอง
router.put('/users/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง หรือรหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const userSql = 'SELECT * FROM User WHERE user_id = ?';
    const [users] = await db.query(userSql, [userId]);
    const user = users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    const updateSql = 'UPDATE User SET user_password = ? WHERE user_id = ?';
    await db.query(updateSql, [hashedNewPassword, userId]);

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
});

// PUT /api/users/profile - อัปเดตข้อมูลโปรไฟล์ของตัวเอง
router.put('/users/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { user_fname, user_lname, user_tel } = req.body;

  if (!user_fname || !user_lname) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อและนามสกุล' });
  }

  try {
    const sql = 'UPDATE User SET user_fname = ?, user_lname = ?, user_tel = ? WHERE user_id = ?';
    await db.query(sql, [user_fname, user_lname, user_tel, userId]);

    res.json({ message: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' });
  }
});


// --- PASSWORD RESET ROUTES (Public) ---

// POST /api/forgot-password - ขอรีเซ็ตรหัสผ่าน
router.post('/forgot-password', async (req, res) => {
  try {
    const { user_email } = req.body;
    const sqlFind = 'SELECT * FROM User WHERE user_email = ?';
    const [users] = await db.query(sqlFind, [user_email]);

    if (users.length > 0) {
      const user = users[0];
      const resetToken = crypto.randomBytes(20).toString('hex');

      const sqlUpdate = 'UPDATE User SET reset_password_token = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE user_id = ?';
      await db.query(sqlUpdate, [resetToken, user.user_id]);

      const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
      const message = `
        <h1>คุณได้ทำการขอรีเซ็ตรหัสผ่านสำหรับ MealVault</h1>
        <p>กรุณาคลิกที่ลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `;

      await sendEmail({
        to: user.user_email,
        subject: 'คำขอรีเซ็ตรหัสผ่าน MealVault',
        html: message,
      });
    }

    res.json({ message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้แล้ว' });

  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// POST /api/reset-password/:token - ตั้งรหัสผ่านใหม่ด้วย Token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetToken = req.params.token;

    const sqlFind = 'SELECT * FROM User WHERE reset_password_token = ? AND reset_password_expires > NOW()';
    const [users] = await db.query(sqlFind, [resetToken]);

    if (users.length === 0) {
      return res.status(400).json({ message: 'Token สำหรับรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' });
    }
    const user = users[0];

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const sqlUpdate = 'UPDATE User SET user_password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE user_id = ?';
    await db.query(sqlUpdate, [hashedPassword, user.user_id]);

    res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;
