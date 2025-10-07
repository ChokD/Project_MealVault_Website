// ที่ด้านบนสุดของไฟล์ routes/userRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
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

    const { error } = await supabase.from('User').insert([newUser]);
    if (error) throw error;

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
    const { data: users, error } = await supabase
      .from('User')
      .select('*')
      .eq('user_email', user_email)
      .limit(1);
    if (error) throw error;

    if (!users || users.length === 0) {
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

// GET /api/me - ดึงข้อมูลผู้ใช้ที่ Login อยู่ (เวอร์ชันแก้ไขล่าสุด)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: users, error: userErr } = await supabase
      .from('User')
      .select('user_id, user_email, user_fname, user_lname, user_tel')
      .eq('user_id', req.user.id)
      .limit(1);
    if (userErr) throw userErr;
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', req.user.id)
      .limit(1);
    if (adminErr) throw adminErr;

    const userData = {
      ...users[0],
      isAdmin: !!(admins && admins.length > 0)
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
    const { data: users, error: findErr } = await supabase
      .from('User')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
    if (findErr) throw findErr;
    const user = users && users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    const { error: updErr } = await supabase
      .from('User')
      .update({ user_password: hashedNewPassword })
      .eq('user_id', userId);
    if (updErr) throw updErr;

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
    const { error } = await supabase
      .from('User')
      .update({ user_fname, user_lname, user_tel })
      .eq('user_id', userId);
    if (error) throw error;

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
    const { data: users, error: findErr } = await supabase
      .from('User')
      .select('*')
      .eq('user_email', user_email)
      .limit(1);
    if (findErr) throw findErr;

    if (users && users.length > 0) {
      const user = users[0];
      const resetToken = crypto.randomBytes(20).toString('hex');

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { error: updErr } = await supabase
        .from('User')
        .update({ reset_password_token: resetToken, reset_password_expires: expiresAt })
        .eq('user_id', user.user_id);
      if (updErr) throw updErr;

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

    const { data: users, error: findErr } = await supabase
      .from('User')
      .select('*')
      .eq('reset_password_token', resetToken)
      .limit(1);
    if (findErr) throw findErr;

    if (!users || users.length === 0 || (users[0].reset_password_expires && new Date(users[0].reset_password_expires) <= new Date())) {
      return res.status(400).json({ message: 'Token สำหรับรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว' });
    }
    const user = users[0];

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updErr } = await supabase
      .from('User')
      .update({ user_password: hashedPassword, reset_password_token: null, reset_password_expires: null })
      .eq('user_id', user.user_id);
    if (updErr) throw updErr;

    res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// --- USER PREFERENCES (calorie limit and allergens) ---

// GET /api/preferences (stored in User table)
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('User')
      .select('calorie_limit, allergies')
      .eq('user_id', userId)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return res.json({ calorie_limit: null, allergens: [] });
    const row = data[0];
    const allergens = row.allergies ? String(row.allergies).split(',').map(s => s.trim()).filter(Boolean) : [];
    res.json({ calorie_limit: row.calorie_limit ?? null, allergens });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงค่าการตั้งค่า' });
  }
});

// PUT /api/preferences (stored in User table)
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { calorie_limit, allergens } = req.body;
    const allergies = Array.isArray(allergens) ? allergens.join(',') : null;
    const { error } = await supabase
      .from('User')
      .update({ calorie_limit, allergies })
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ message: 'อัปเดตการตั้งค่าสำเร็จ' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า' });
  }
});

module.exports = router;