// ที่ด้านบนสุดของไฟล์ routes/userRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { supabase } = require('../config/supabase');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../middleware/authMiddleware');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const upload = require('../middleware/supabaseUploadMiddleware');

// Removed unused helper functions now that community post favorites are not supported

// --- AUTHENTICATION ROUTES ---

// POST /api/register - สมัครสมาชิก
router.post('/register', async (req, res) => {
  const { user_email, user_fname, user_lname, user_password, user_tel, allergies, favorite_foods } = req.body;

  if (!user_email || !user_password || !user_fname) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  // ตรวจสอบว่า Supabase client พร้อมใช้งาน
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return res.status(500).json({ message: 'Database connection error' });
  }

  try {
    // ตรวจสอบว่ามี email นี้อยู่แล้วหรือไม่
    const { data: existingUsers, error: checkError } = await supabase
      .from('User')
      .select('user_email')
      .eq('user_email', user_email)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing user:', checkError);
      throw checkError;
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_password, salt);

    console.log(`Registering new user: ${user_email}`);
    console.log(`Password hash generated: ${hashedPassword.substring(0, 20)}...`);

    // Process allergies and favorite_foods (convert array to comma-separated string if needed)
    const allergiesStr = Array.isArray(allergies) 
      ? allergies.join(',') 
      : (allergies || null);
    const favoriteFoodsStr = Array.isArray(favorite_foods) 
      ? favorite_foods.join(',') 
      : (favorite_foods || null);

    const newUser = {
      user_id: 'U' + Date.now().toString().slice(-6),
      user_email,
      user_fname,
      user_lname,
      user_password: hashedPassword,
      user_tel: user_tel || null, // เบอร์โทรเป็น optional
      allergies: allergiesStr,
      favorite_foods: favoriteFoodsStr
    };

    const { data, error } = await supabase.from('User').insert([newUser]).select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log(`User registered successfully: ${user_email}`);
    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/login - เข้าสู่ระบบ
router.post('/login', async (req, res) => {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  // ตรวจสอบว่า Supabase client พร้อมใช้งาน
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return res.status(500).json({ message: 'Database connection error' });
  }

  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('*')
      .eq('user_email', user_email)
      .limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (!users || users.length === 0) {
      console.log(`Login attempt failed: User not found for email: ${user_email}`);
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    
    const user = users[0];
    
    // ตรวจสอบว่า user_password มีค่า
    if (!user.user_password) {
      console.error('User password is missing in database');
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }

    // Debug: แสดงข้อมูลที่สำคัญ (ไม่แสดง password)
    console.log(`\n=== Login Attempt ===`);
    console.log(`Email: ${user_email}`);
    console.log(`User found: Yes`);
    console.log(`User ID: ${user.user_id}`);
    console.log(`Password hash exists: ${!!user.user_password}`);
    console.log(`Password hash length: ${user.user_password?.length || 0}`);
    console.log(`Password hash starts with: ${user.user_password?.substring(0, 7) || 'N/A'}`);
    console.log(`Input password length: ${user_password?.length || 0}`);

    // ทดสอบ password comparison
    console.log(`\nComparing passwords...`);
    const isMatch = await bcrypt.compare(user_password, user.user_password);
    console.log(`Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`❌ Password mismatch for user: ${user_email}`);
      console.log(`   Hash in DB: ${user.user_password?.substring(0, 20)}...`);
      
      // ทดสอบด้วยการ hash ใหม่เพื่อ debug
      const testHash = await bcrypt.hash(user_password, 10);
      console.log(`   Test hash of input: ${testHash.substring(0, 20)}...`);
      console.log(`   Hashes are different (expected - bcrypt generates unique hashes each time)\n`);
      
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    
    console.log(`✅ Login successful for user: ${user_email}\n`);

    // ตรวจสอบว่าเป็น admin หรือไม่
    const { data: adminCheck } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', user.user_id)
      .limit(1);
    
    const isAdmin = adminCheck && adminCheck.length > 0;

    // ตรวจสอบว่า JWT_SECRET ถูกตั้งค่าไว้
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not set in .env file');
      return res.status(500).json({ 
        message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ - JWT_SECRET not configured' 
      });
    }

    const payload = {
      user: {
        id: user.user_id,
        email: user.user_email,
        user_role: isAdmin ? 'admin' : 'user'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้าง token' });
        }
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

// POST /api/auth/google - เข้าสู่ระบบด้วย Google
router.post('/auth/google', async (req, res) => {
  if (!googleClient) {
    return res.status(500).json({ message: 'ยังไม่ได้ตั้งค่า Google Client ID บนเซิร์ฟเวอร์' });
  }

  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'ไม่พบข้อมูลรับรองจาก Google' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) {
      return res.status(400).json({ message: 'ไม่พบอีเมลจากบัญชี Google' });
    }

    const { data: users, error: findErr } = await supabase
      .from('User')
      .select('*')
      .eq('user_email', email)
      .limit(1);
    if (findErr) throw findErr;

    let user = users && users[0];
    let isNewUser = false;

    if (!user) {
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const newUser = {
        user_id: 'U' + Date.now().toString().slice(-6),
        user_email: email,
        user_fname: payload?.given_name || email.split('@')[0],
        user_lname: payload?.family_name || '',
        user_password: hashedPassword,
        user_tel: null,
      };

      const { data: insertedUser, error: insertErr } = await supabase
        .from('User')
        .insert([newUser])
        .select()
        .single();
      if (insertErr) throw insertErr;

      user = insertedUser || newUser;
      isNewUser = true;
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    const { data: adminCheck } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', user.user_id)
      .limit(1);
    
    const isAdmin = adminCheck && adminCheck.length > 0;

    const payloadToken = {
      user: {
        id: user.user_id,
        email: user.user_email,
        user_role: isAdmin ? 'admin' : 'user'
      },
    };

    jwt.sign(
      payloadToken,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, isNewUser });
      }
    );
  } catch (error) {
    console.error('Error during Google login:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' });
  }
});


// --- USER PROFILE ROUTES (Protected) ---

// GET /api/me - ดึงข้อมูลผู้ใช้ที่ Login อยู่ (เวอร์ชันแก้ไขล่าสุด)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: users, error: userErr } = await supabase
      .from('User')
      .select('user_id, user_email, user_fname, user_lname, user_tel, user_image, allergies, favorite_foods')
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

    const user = users[0];
    // Convert comma-separated strings to arrays for allergies and favorite_foods
    const allergiesArray = user.allergies 
      ? String(user.allergies).split(',').map(s => s.trim()).filter(Boolean) 
      : [];
    const favoriteFoodsArray = user.favorite_foods 
      ? String(user.favorite_foods).split(',').map(s => s.trim()).filter(Boolean) 
      : [];

    const userData = {
      ...user,
      allergies: allergiesArray,
      favorite_foods: favoriteFoodsArray,
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

// PUT /api/users/profile - อัปเดตข้อมูลโปรไฟล์ของตัวเอง (รวมถึงรหัสผ่าน)
router.put('/users/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { user_fname, user_lname, user_tel, oldPassword, newPassword } = req.body;

  if (!user_fname) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อ' });
  }

  // ตรวจสอบว่า Supabase client พร้อมใช้งาน
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return res.status(500).json({ message: 'Database connection error' });
  }

  try {
    // ถ้ามีการแก้ไขรหัสผ่าน
    if (oldPassword && newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
      }

      // ดึงข้อมูลผู้ใช้เพื่อตรวจสอบรหัสผ่านเดิม
      const { data: users, error: findErr } = await supabase
        .from('User')
        .select('user_password')
        .eq('user_id', userId)
        .limit(1);
      
      if (findErr) throw findErr;
      
      if (!users || users.length === 0) {
        return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
      }

      const user = users[0];
      
      // ตรวจสอบรหัสผ่านเดิม
      const isMatch = await bcrypt.compare(oldPassword, user.user_password);
      if (!isMatch) {
        return res.status(401).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
      }

      // Hash รหัสผ่านใหม่
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // อัปเดตข้อมูลทั้งหมด (รวมรหัสผ่าน)
      const updateData = {
        user_fname,
        user_lname: user_lname || null,
        user_tel: user_tel || null,
        user_password: hashedNewPassword
      };

      const { error } = await supabase
        .from('User')
        .update(updateData)
        .eq('user_id', userId);
      
      if (error) throw error;

      console.log(`Profile and password updated for user: ${userId}`);
      return res.json({ message: 'อัปเดตข้อมูลโปรไฟล์และรหัสผ่านสำเร็จ' });
    }

    // ถ้าไม่มีการแก้ไขรหัสผ่าน (อัปเดตแค่ข้อมูลโปรไฟล์)
    const updateData = {
      user_fname,
      user_lname: user_lname || null,
      user_tel: user_tel || null
    };

    const { error } = await supabase
      .from('User')
      .update(updateData)
      .eq('user_id', userId);
    
    if (error) throw error;

    console.log(`Profile updated for user: ${userId}`);
    res.json({ message: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' });
  }
});

// PUT /api/users/profile/image - อัปโหลดรูปภาพโปรไฟล์
router.put('/users/profile/image', authMiddleware, ...upload.single('user_image'), async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
  }

  // ตรวจสอบว่า Supabase client พร้อมใช้งาน
  if (!supabase) {
    console.error('Supabase client is not initialized');
    return res.status(500).json({ message: 'Database connection error' });
  }

  try {
    // Use full Supabase URL if available, otherwise fallback to filename
    const imageUrl = req.uploadedFiles?.[0]?.url || req.file.filename;
    
    // อัปเดตรูปภาพโปรไฟล์ในฐานข้อมูล
    const { error } = await supabase
      .from('User')
      .update({ user_image: imageUrl })
      .eq('user_id', userId);
    
    if (error) throw error;

    console.log(`Profile image updated for user: ${userId}`);
    res.json({ 
      message: 'อัปโหลดรูปภาพโปรไฟล์สำเร็จ',
      image_url: imageUrl
    });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพโปรไฟล์' });
  }
});


// --- PASSWORD RESET ROUTES (Public) ---

// POST /api/forgot-password - ขอรีเซ็ตรหัสผ่าน
router.post('/forgot-password', async (req, res) => {
  try {
    const { user_email } = req.body;
    
    if (!user_email) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }

    const { data: users, error: findErr } = await supabase
      .from('User')
      .select('*')
      .eq('user_email', user_email)
      .limit(1);
    if (findErr) throw findErr;

    if (users && users.length > 0) {
      const user = users[0];
      const resetToken = crypto.randomBytes(32).toString('hex');

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { error: updErr } = await supabase
        .from('User')
        .update({ reset_password_token: resetToken, reset_password_expires: expiresAt })
        .eq('user_id', user.user_id);
      if (updErr) throw updErr;

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
      
      // Store reset link for development/testing
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 PASSWORD RESET REQUESTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 User Email: ${user.user_email}`);
      console.log(`🔗 Reset Link: ${resetUrl}`);
      console.log(`⏰ Expires: ${new Date(expiresAt).toLocaleString()}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Skip email sending if EMAIL_USER not configured
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
        console.log('⚠️  Email not configured - Reset link printed to console only');
      } else {
        // Try to send email if configured
        try {
          const message = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🍽️ MealVault</h1>
                  <p>คำขอรีเซ็ตรหัสผ่าน</p>
                </div>
                <div class="content">
                  <p>สวัสดีค่ะ,</p>
                  <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี MealVault ของคุณ</p>
                  <p>กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                  <center>
                    <a href="${resetUrl}" class="button">ตั้งรหัสผ่านใหม่</a>
                  </center>
                  <p style="color: #ef4444; font-size: 14px;">⚠️ ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
                  <p style="font-size: 14px; color: #6b7280;">หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                  <p style="font-size: 12px; color: #9ca3af;">หากปุ่มไม่ทำงาน คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:<br>
                  <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a></p>
                </div>
                <div class="footer">
                  <p>© 2025 MealVault - ระบบจัดการมื้ออาหารอัจฉริยะ</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: user.user_email,
            subject: '🔐 คำขอรีเซ็ตรหัสผ่าน MealVault',
            html: message,
          });
          console.log(`✅ Password reset email sent to: ${user.user_email}`);
        } catch (emailError) {
          console.error('❌ Failed to send reset email:', emailError.message);
          console.log('⚠️  Email sending failed - But reset link is available in console above');
        }
      }
    }

    res.json({ message: 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้แล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ' });

  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' });
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
      .select('calorie_limit, allergies, favorite_foods')
      .eq('user_id', userId)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return res.json({ calorie_limit: null, allergens: [], favorite_foods: [] });
    const row = data[0];
    const allergens = row.allergies ? String(row.allergies).split(',').map(s => s.trim()).filter(Boolean) : [];
    const favoriteFoods = row.favorite_foods ? String(row.favorite_foods).split(',').map(s => s.trim()).filter(Boolean) : [];
    res.json({ calorie_limit: row.calorie_limit ?? null, allergens, favorite_foods: favoriteFoods });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงค่าการตั้งค่า' });
  }
});

// PUT /api/preferences (stored in User table)
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { calorie_limit, allergens, favorite_foods } = req.body;
    
    const updateData = {};
    
    // Always update calorie_limit if provided
    if (calorie_limit !== undefined) {
      updateData.calorie_limit = calorie_limit;
    }
    
    // Process allergies: convert array to comma-separated string, or null if empty
    if (allergens !== undefined) {
      if (Array.isArray(allergens)) {
        updateData.allergies = allergens.length > 0 ? allergens.join(',') : null;
      } else if (typeof allergens === 'string') {
        updateData.allergies = allergens.trim() || null;
      } else {
        updateData.allergies = null;
      }
    }
    
    // Process favorite_foods: convert array to comma-separated string, or null if empty
    if (favorite_foods !== undefined) {
      if (Array.isArray(favorite_foods)) {
        updateData.favorite_foods = favorite_foods.length > 0 ? favorite_foods.join(',') : null;
      } else if (typeof favorite_foods === 'string') {
        updateData.favorite_foods = favorite_foods.trim() || null;
      } else {
        updateData.favorite_foods = null;
      }
    }
    
    const { error } = await supabase
      .from('User')
      .update(updateData)
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ message: 'อัปเดตการตั้งค่าสำเร็จ' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า' });
  }
});

// --- PUBLIC USER PROFILE ROUTES ---

// GET /api/users/:id/public-profile - ข้อมูลสาธารณะของผู้ใช้
router.get('/users/:id/public-profile', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('User')
      .select('user_id, user_fname, user_lname, user_image')
      .eq('user_id', id)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    const user = data[0];
    res.json({
      user_id: user.user_id,
      user_fname: user.user_fname,
      user_lname: user.user_lname,
      user_image: user.user_image,
      full_name: [user.user_fname, user.user_lname].filter(Boolean).join(' ')
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
  }
});

// GET /api/users/:id/posts - รายชื่อโพสต์ของผู้ใช้
router.get('/users/:id/posts', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: posts, error } = await supabase
      .from('CommunityPost')
      .select('cpost_id, cpost_title, cpost_datetime, cpost_image, cpost_images, like_count')
      .eq('user_id', id)
      .not('cpost_title', 'like', '[Report Only]%')
      .order('cpost_datetime', { ascending: false });

    if (error) throw error;
    const formatted = (posts || []).map(post => {
      let images = [];
      if (Array.isArray(post.cpost_images)) {
        images = post.cpost_images.filter(Boolean);
      } else if (post.cpost_image) {
        images = [post.cpost_image];
      }
      return {
        ...post,
        cpost_images: images,
        cpost_image: images[0] || null
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงโพสต์ของผู้ใช้' });
  }
});

// GET /api/users/:id/comments - รายชื่อคอมเมนต์ของผู้ใช้
router.get('/users/:id/comments', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: comments, error } = await supabase
      .from('CommunityComment')
      .select(`
        comment_id,
        comment_text,
        comment_datetime,
        cpost_id,
        CommunityPost:cpost_id (cpost_id, cpost_title, cpost_image)
      `)
      .eq('user_id', id)
      .order('comment_datetime', { ascending: false });

    if (error) throw error;

    // Format response
    const formatted = (comments || []).map(comment => ({
      comment_id: comment.comment_id,
      comment_text: comment.comment_text,
      comment_datetime: comment.comment_datetime,
      cpost_id: comment.cpost_id,
      post_title: comment.CommunityPost?.cpost_title || '',
      post_image: comment.CommunityPost?.cpost_image || null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงคอมเมนต์ของผู้ใช้' });
  }
});

// GET /api/users/:id/liked-menus - รายชื่อเมนู/สูตรจากผู้ใช้ที่กดชื่นชอบ
router.get('/users/:id/liked-menus', async (req, res) => {
  const { id } = req.params;

  try {
    const [{ data: menuLikes, error: menuError }, { data: recipeLikes, error: recipeError }] = await Promise.all([
      supabase
        .from('MenuLike')
        .select(`
          id,
          created_at,
          menu_id,
          Menu:menu_id (menu_id, menu_name, menu_image, menu_description)
        `)
        .eq('user_id', id)
        .order('id', { ascending: false }),
      supabase
        .from('UserRecipeLike')
        .select(`
          id,
          created_at,
          recipe_id,
          UserRecipe:recipe_id (
            recipe_id,
            recipe_title,
            recipe_image,
            recipe_summary,
            recipe_category
          )
        `)
        .eq('user_id', id)
        .order('id', { ascending: false })
    ]);

    if (menuError) throw menuError;
    if (recipeError) throw recipeError;

    const formattedMenus = (menuLikes || [])
      .filter(like => like.Menu)
      .map(like => ({
        type: 'menu',
        menu_id: like.menu_id,
        menu_name: like.Menu.menu_name,
        menu_image: like.Menu.menu_image,
        menu_description: like.Menu.menu_description,
        liked_at: like.created_at || null
      }));

    const formattedRecipes = (recipeLikes || [])
      .filter(like => like.UserRecipe)
      .map(like => ({
        type: 'recipe',
        recipe_id: like.recipe_id,
        menu_name: like.UserRecipe.recipe_title,
        menu_image: like.UserRecipe.recipe_image,
        menu_description: like.UserRecipe.recipe_summary,
        recipe_category: like.UserRecipe.recipe_category,
        liked_at: like.created_at || null
      }));

    const combined = [...formattedMenus, ...formattedRecipes]
      .sort((a, b) => new Date(b.liked_at || 0) - new Date(a.liked_at || 0));

    res.json(combined);
  } catch (error) {
    console.error('Error fetching user liked menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงเมนูที่ชื่นชอบ' });
  }
});

// GET /api/users/:id/recipes - รายชื่อสูตรอาหารของผู้ใช้
router.get('/users/:id/recipes', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: recipes, error } = await supabase
      .from('UserRecipe')
      .select('recipe_id, recipe_title, recipe_image, created_at, recipe_category')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(recipes || []);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงสูตรอาหารของผู้ใช้' });
  }
});

module.exports = router;