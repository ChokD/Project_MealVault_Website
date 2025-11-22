const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// สร้าง API Endpoint สำหรับส่งรายงาน
// POST /api/reports
router.post('/reports', authMiddleware, async (req, res) => {
  // ดึงข้อมูลจาก Request Body
  const { cpost_id, creport_reason } = req.body;

  // ดึง user_id ของผู้ที่รายงานจาก Token
  const user_id = req.user.id;

  if (!cpost_id || !creport_reason) {
    return res.status(400).json({ message: 'กรุณาระบุ ID ของโพสต์และเหตุผลในการรายงาน' });
  }

  try {
    const newReport = {
      cpost_id,
      creport_reason,
      user_id,
      creport_datetime: new Date().toISOString()
    };

    const { error } = await supabase.from('CommunityReport').insert([newReport]);
    if (error) throw error;

    res.status(201).json({ message: 'ส่งรายงานสำเร็จ' });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งรายงาน' });
  }
});

module.exports = router;