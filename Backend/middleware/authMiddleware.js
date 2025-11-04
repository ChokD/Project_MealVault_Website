// ไฟล์ middleware/authMiddleware.js ที่ถูกต้อง

const jwt = require('jsonwebtoken');

// --- มีการประกาศฟังก์ชันแค่ครั้งเดียว ---
const authMiddleware = (req, res, next) => {
  // 1. ดึง Token จาก Header
  const authHeader = req.header('Authorization');

  // 2. ตรวจสอบว่ามี Header หรือ Token หรือไม่
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'ไม่มี Token, การเข้าถึงถูกปฏิเสธ' });
  }

  try {
    // 3. ตรวจสอบว่า JWT_SECRET ถูกตั้งค่าไว้
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not set in .env file');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // 4. แยกเอาเฉพาะส่วนของ Token
    const token = authHeader.split(' ')[1];

    // 5. ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. เก็บข้อมูล user ไว้ใน request
    req.user = decoded.user;

    // 6. ไปขั้นตอนต่อไป
    next();

  } catch (err) {
    res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
  }
};
// ------------------------------------

// และมีการ export แค่ครั้งเดียว
module.exports = authMiddleware;