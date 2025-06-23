const mysql = require('mysql2');

// สร้าง Connection Pool เพื่อจัดการการเชื่อมต่ออย่างมีประสิทธิภาพ
const pool = mysql.createPool({
  host: process.env.DB_HOST,       // ดึงค่ามาจาก .env
  user: process.env.DB_USER,       // ดึงค่ามาจาก .env
  password: process.env.DB_PASSWORD, // ดึงค่ามาจาก .env
  database: process.env.DB_NAME,   // ดึงค่ามาจาก .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ใช้ .promise() เพื่อให้สามารถเขียนโค้ดแบบ async/await ที่ทันสมัยได้
module.exports = pool.promise();