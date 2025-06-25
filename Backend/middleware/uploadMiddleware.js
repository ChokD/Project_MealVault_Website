const multer = require('multer');
const path = require('path');

// ตั้งค่าการจัดเก็บไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/'); // กำหนดโฟลเดอร์ที่จะบันทึกไฟล์
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน โดยใช้วันที่และชื่อไฟล์เดิม
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// สร้าง Middleware ของ Multer
const upload = multer({ storage: storage });

module.exports = upload;