// 1. นำเข้า library และไฟล์ที่จำเป็น
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// นำเข้าไฟล์ Routes ทั้งหมด
const userRoutes = require('./routes/userRoutes');
const menuRoutes = require('./routes/menuRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const recommendRoutes = require('./routes/recommendRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const mealCalendarRoutes = require('./routes/mealCalendarRoutes');

// 2. สร้างแอปพลิเคชัน express
const app = express();

// 3. ตั้งค่า Middleware ที่จำเป็น
app.use(cors()); // อนุญาตการเชื่อมต่อจาก Frontend
app.use(express.json()); // ทำให้ Express อ่าน JSON ได้
app.use('/images', express.static('public/images')); // ทำให้เข้าถึงไฟล์รูปภาพได้

// 4. กำหนดพอร์ต
const PORT = process.env.PORT || 3000;

// 5. สร้าง Route แรกสำหรับทดสอบ
app.get('/', (req, res) => {
  res.send('Hello, MealVault Backend!');
});

// 6. นำ Route ทั้งหมดมาใช้งาน (สำคัญที่สุด)
app.use('/api', userRoutes);
app.use('/api', menuRoutes); 
app.use('/api', postRoutes);
app.use('/api', adminRoutes);
app.use('/api', categoryRoutes);
app.use('/api', reportRoutes);
app.use('/api', recommendRoutes);
app.use('/api', chatbotRoutes);
app.use('/api', mealCalendarRoutes);

// 7. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
  console.log(`Database connected successfully!`);
  console.log(`Server is running on port ${PORT}`);
});