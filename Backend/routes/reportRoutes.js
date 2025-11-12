const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('./notificationRoutes');

// รายการประเภทการรายงาน
const REPORT_TYPES = {
  INAPPROPRIATE_LANGUAGE: 'inappropriate_language',
  FALSE_INFORMATION: 'false_information',
  COPYRIGHT_VIOLATION: 'copyright_violation',
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  OTHER: 'other'
};

// สร้าง API Endpoint สำหรับส่งรายงาน
// POST /api/reports
router.post('/reports', authMiddleware, async (req, res) => {
  // ดึงข้อมูลจาก Request Body
  const { cpost_id, comment_id, creport_type, creport_details } = req.body;

  // ดึง user_id ของผู้ที่รายงานจาก Token
  const user_id = req.user.id;

  // ตรวจสอบว่าต้องมี cpost_id หรือ comment_id อย่างน้อย 1 ตัว
  if (!cpost_id && !comment_id) {
    return res.status(400).json({ message: 'กรุณาระบุ ID ของโพสต์หรือคอมเมนต์ที่ต้องการรายงาน' });
  }

  // ตรวจสอบว่ามี creport_type หรือไม่
  if (!creport_type) {
    return res.status(400).json({ message: 'กรุณาเลือกประเภทการรายงาน' });
  }

  // ตรวจสอบว่า creport_type อยู่ในรายการที่กำหนดหรือไม่
  if (!Object.values(REPORT_TYPES).includes(creport_type)) {
    return res.status(400).json({ message: 'ประเภทการรายงานไม่ถูกต้อง' });
  }

  // ตรวจสอบว่าโพสต์หรือคอมเมนต์ที่รายงานมีอยู่จริงหรือไม่
  try {
    if (cpost_id) {
      const { data: post, error: postError } = await supabase
        .from('CommunityPost')
        .select('cpost_id')
        .eq('cpost_id', cpost_id)
        .limit(1);
      
      if (postError) throw postError;
      if (!post || post.length === 0) {
        return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการรายงาน' });
      }
    }

    // สำหรับกรณีรายงานคอมเมนต์ ต้องดึง cpost_id จาก comment
    let finalCpostId = cpost_id;
    let finalCommentId = comment_id;
    
    if (comment_id) {
      // ดึงข้อมูลคอมเมนต์พร้อม cpost_id
      const { data: comment, error: commentError } = await supabase
        .from('CommunityComment')
        .select('comment_id, cpost_id')
        .eq('comment_id', comment_id)
        .limit(1);
      
      if (commentError) throw commentError;
      if (!comment || comment.length === 0) {
        return res.status(404).json({ message: 'ไม่พบคอมเมนต์ที่ต้องการรายงาน' });
      }
      
      // ใช้ cpost_id จาก comment ถ้ายังไม่มี
      if (!finalCpostId && comment[0].cpost_id) {
        finalCpostId = comment[0].cpost_id;
      }
    }

    // ดึงข้อมูลผู้รายงาน
    const { data: reporter, error: reporterErr } = await supabase
      .from('User')
      .select('user_fname')
      .eq('user_id', user_id)
      .limit(1);

    const reporterName = reporter && reporter[0] ? reporter[0].user_fname : 'Someone';

    // ดึงข้อมูลโพสต์หรือคอมเมนต์ที่ถูกรายงาน
    let postTitle = null;
    if (finalCpostId) {
      const { data: post, error: postError } = await supabase
        .from('CommunityPost')
        .select('cpost_title')
        .eq('cpost_id', finalCpostId)
        .limit(1);
      if (!postError && post && post.length > 0) {
        postTitle = post[0].cpost_title;
      }
    }

    // สร้างรายงานใหม่
    const newReport = {
      creport_id: 'RP' + Date.now().toString(),
      creport_type,
      creport_details: creport_details || null,
      cpost_id: finalCpostId || null,
      comment_id: finalCommentId || null,
      user_id,
      creport_datetime: new Date().toISOString()
    };

    const { error } = await supabase.from('CommunityReport').insert([newReport]);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // ดึงข้อมูล Admin ทั้งหมด
    const { data: admins, error: adminErr } = await supabase
      .from('Admin')
      .select('admin_id');

    if (!adminErr && admins && admins.length > 0) {
      // สร้าง notification สำหรับ Admin แต่ละคน
      const reportTypeLabels = {
        [REPORT_TYPES.INAPPROPRIATE_LANGUAGE]: 'ใช้ภาษาไม่เหมาะสม',
        [REPORT_TYPES.FALSE_INFORMATION]: 'เผยแพร่ข้อมูลที่เป็นเท็จ',
        [REPORT_TYPES.COPYRIGHT_VIOLATION]: 'การละเมิดลิขสิทธิ์',
        [REPORT_TYPES.SPAM]: 'สแปมหรือโฆษณา',
        [REPORT_TYPES.HARASSMENT]: 'การกลั่นแกล้งหรือข่มขู่',
        [REPORT_TYPES.OTHER]: 'อื่นๆ'
      };

      const reportTypeLabel = reportTypeLabels[creport_type] || 'อื่นๆ';
      const notificationMessage = postTitle 
        ? `${reporterName} รายงานโพสต์: "${postTitle}" (${reportTypeLabel})`
        : `${reporterName} รายงานคอมเมนต์ (${reportTypeLabel})`;

      for (const admin of admins) {
        await createNotification({
          notification_type: 'report',
          notification_message: notificationMessage,
          user_id: admin.admin_id,
          cpost_id: finalCpostId || null, // ใช้ finalCpostId แทน cpost_id เพื่อให้มีค่าเมื่อรายงานคอมเมนต์
          comment_id: finalCommentId || null,
          actor_user_id: user_id,
          creport_id: newReport.creport_id
        });
      }
    }

    res.status(201).json({ message: 'ส่งรายงานสำเร็จ', report: newReport });

  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งรายงาน' });
  }
});

// GET /api/reports/types - ดึงรายการประเภทการรายงาน
router.get('/reports/types', (req, res) => {
  const reportTypeLabels = {
    [REPORT_TYPES.INAPPROPRIATE_LANGUAGE]: 'ใช้ภาษาไม่เหมาะสม',
    [REPORT_TYPES.FALSE_INFORMATION]: 'เผยแพร่ข้อมูลที่เป็นเท็จ',
    [REPORT_TYPES.COPYRIGHT_VIOLATION]: 'การละเมิดลิขสิทธิ์',
    [REPORT_TYPES.SPAM]: 'สแปมหรือโฆษณา',
    [REPORT_TYPES.HARASSMENT]: 'การกลั่นแกล้งหรือข่มขู่',
    [REPORT_TYPES.OTHER]: 'อื่นๆ'
  };

  const types = Object.values(REPORT_TYPES).map(type => ({
    value: type,
    label: reportTypeLabels[type]
  }));

  res.json(types);
});

module.exports = router;