// 1. นำเข้า library และไฟล์ที่จำเป็น
require('dotenv').config();
// --- เพิ่มโค้ดส่วนนี้เพื่อ Debug ---
console.log('--- Environment Variables ---');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
// เราจะไม่แสดงรหัสผ่านตรงๆ เพื่อความปลอดภัย
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Loaded' : 'NOT LOADED'); 
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded' : 'NOT LOADED');
console.log('---------------------------');
// --- จบส่วน Debug ---
const express = require('express');
const cors = require('cors'); //
const db = require('./config/db');
const userRoutes = require('./routes/userRoutes'); // <-- ตรวจสอบว่ามีบรรทัดนี้
const menuRoutes = require('./routes/menuRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const recommendRoutes = require('./routes/recommendRoutes');

// 2. สร้างแอปพลิเคชัน express
const app = express();

// 3. ตั้งค่า Middleware เพื่อรับข้อมูล JSON
app.use(cors());
app.use(express.json());

// 4. กำหนดพอร์ต
const PORT = process.env.PORT || 3000;

// 5. ทดสอบการเชื่อมต่อฐานข้อมูล
db.getConnection()
  .then(connection => {
    console.log('Database connected successfully!');
    connection.release();
  })
  .catch(error => {
    console.error('Error connecting to the database:', error);
  });

// 6. สร้าง Route แรกสำหรับทดสอบ
app.get('/', (req, res) => {
  res.send('Hello, MealVault Backend!');
});

// 7. นำ Route ของผู้ใช้มาใช้งาน (สำคัญมาก)
app.use('/api', userRoutes); // <-- ตรวจสอบว่ามีบรรทัดนี้
app.use('/api', menuRoutes); 
app.use('/api', postRoutes);
app.use('/api', adminRoutes);
app.use('/api', categoryRoutes);
app.use('/api', reportRoutes);
app.use('/api', recommendRoutes);

// 8. สั่งให้เซิร์ฟเวอร์เริ่มทำงาน
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});