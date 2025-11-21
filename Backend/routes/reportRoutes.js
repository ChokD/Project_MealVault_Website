const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('./notificationRoutes');
const sendEmail = require('../utils/sendEmail');

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
  const { cpost_id, comment_id, recipe_id, creport_type, creport_details } = req.body;

  // ดึง user_id ของผู้ที่รายงานจาก Token
  const user_id = req.user.id;

  // ตรวจสอบว่าต้องมี cpost_id, comment_id หรือ recipe_id อย่างน้อย 1 ตัว
  if (!cpost_id && !comment_id && !recipe_id) {
    return res.status(400).json({ message: 'กรุณาระบุ ID ของโพสต์, คอมเมนต์ หรือสูตรอาหารที่ต้องการรายงาน' });
  }

  // ตรวจสอบว่ามี creport_type หรือไม่
  if (!creport_type) {
    return res.status(400).json({ message: 'กรุณาเลือกประเภทการรายงาน' });
  }

  // ตรวจสอบว่า creport_type อยู่ในรายการที่กำหนดหรือไม่
  if (!Object.values(REPORT_TYPES).includes(creport_type)) {
    return res.status(400).json({ message: 'ประเภทการรายงานไม่ถูกต้อง' });
  }

    // ตรวจสอบว่าโพสต์, คอมเมนต์ หรือสูตรอาหารที่รายงานมีอยู่จริงหรือไม่
    try {
      if (recipe_id) {
        // ตรวจสอบว่าสูตรอาหารมีอยู่จริง
        const { data: recipe, error: recipeError } = await supabase
          .from('UserRecipe')
          .select('recipe_id, user_id, recipe_title')
          .eq('recipe_id', recipe_id)
          .limit(1);
        
        if (recipeError) throw recipeError;
        if (!recipe || recipe.length === 0) {
          return res.status(404).json({ message: 'ไม่พบสูตรอาหารที่ต้องการรายงาน' });
        }
        
        // ตรวจสอบว่าไม่ใช่เจ้าของสูตร
        if (recipe[0].user_id === user_id) {
          return res.status(400).json({ message: 'คุณไม่สามารถรายงานสูตรอาหารของตัวเองได้' });
        }
      }
      
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

    // ดึงข้อมูลโพสต์, คอมเมนต์ หรือสูตรอาหารที่ถูกรายงาน
    let postTitle = null;
    if (recipe_id) {
      const { data: recipe, error: recipeError } = await supabase
        .from('UserRecipe')
        .select('recipe_title')
        .eq('recipe_id', recipe_id)
        .limit(1);
      if (!recipeError && recipe && recipe.length > 0) {
        postTitle = recipe[0].recipe_title;
      }
    } else if (finalCpostId) {
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
    // สำหรับสูตรอาหาร เก็บ recipe_id ใน creport_details หรือสร้าง field ใหม่
    // เนื่องจาก CommunityReport ไม่มี recipe_id field โดยตรง เราจะเก็บใน creport_details
    const reportDetails = recipe_id 
      ? `[RECIPE_ID:${recipe_id}] ${creport_details || ''}`.trim()
      : creport_details || null;

    const newReport = {
      creport_id: 'RP' + Date.now().toString(),
      creport_type,
      creport_details: reportDetails,
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

    const adminIds = !adminErr && Array.isArray(admins)
      ? admins.map((admin) => admin.admin_id).filter(Boolean)
      : [];

    if (adminIds.length === 0) {
      console.warn('Report submitted but no admins are registered to receive notifications.');
    } else {
      // เตรียมข้อมูลสำหรับ notification / email
      const reportTypeLabels = {
        [REPORT_TYPES.INAPPROPRIATE_LANGUAGE]: 'ใช้ภาษาไม่เหมาะสม',
        [REPORT_TYPES.FALSE_INFORMATION]: 'เผยแพร่ข้อมูลที่เป็นเท็จ',
        [REPORT_TYPES.COPYRIGHT_VIOLATION]: 'การละเมิดลิขสิทธิ์',
        [REPORT_TYPES.SPAM]: 'สแปมหรือโฆษณา',
        [REPORT_TYPES.HARASSMENT]: 'การกลั่นแกล้งหรือข่มขู่',
        [REPORT_TYPES.OTHER]: 'อื่นๆ'
      };

      const reportTypeLabel = reportTypeLabels[creport_type] || 'อื่นๆ';
      let notificationMessage = '';
      if (recipe_id) {
        notificationMessage = `${reporterName} รายงานสูตรอาหาร: "${postTitle || 'ไม่ทราบชื่อสูตร'}" (${reportTypeLabel})`;
      } else if (postTitle) {
        notificationMessage = `${reporterName} รายงานโพสต์: "${postTitle}" (${reportTypeLabel})`;
      } else {
        notificationMessage = `${reporterName} รายงานคอมเมนต์ (${reportTypeLabel})`;
      }

      const reportLinkBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      const reportLink = finalCpostId
        ? `${reportLinkBase}/community?post=${finalCpostId}${finalCommentId ? `&comment=${finalCommentId}` : ''}&reported=true`
        : `${reportLinkBase}/admin/reports`;

      // ดึงอีเมลของ Admin เพื่อส่งอีเมลแจ้งเตือน
      const { data: adminUsers, error: adminUsersErr } = await supabase
        .from('User')
        .select('user_id, user_email, user_fname')
        .in('user_id', adminIds);

      if (adminUsersErr) {
        console.error('Error fetching admin emails:', adminUsersErr);
      }

      const adminInfoMap = new Map();
      (adminUsers || []).forEach((adminUser) => {
        adminInfoMap.set(adminUser.user_id, adminUser);
      });

      const emailEnabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

      for (const adminId of adminIds) {
        await createNotification({
          notification_type: 'report',
          notification_message: notificationMessage,
          user_id: adminId,
          cpost_id: finalCpostId || null,
          comment_id: finalCommentId || null,
          actor_user_id: user_id,
          creport_id: newReport.creport_id
        });

        if (emailEnabled && adminInfoMap.has(adminId)) {
          const adminInfo = adminInfoMap.get(adminId);
          if (adminInfo?.user_email) {
            const emailSubject = `MealVault: มีรายงานใหม่ (${reportTypeLabel})`;
            const emailBody = `
              <p>สวัสดี ${adminInfo.user_fname || 'ผู้ดูแลระบบ'},</p>
              <p>${reporterName} ได้รายงาน${recipe_id ? 'สูตรอาหาร' : finalCommentId ? 'คอมเมนต์' : 'โพสต์'} (${reportTypeLabel}).</p>
              ${postTitle ? `<p><strong>หัวข้อ:</strong> ${postTitle}</p>` : ''}
              ${creport_details ? `<p><strong>รายละเอียดจากผู้รายงาน:</strong> ${creport_details}</p>` : ''}
              <p><a href="${reportLink}" target="_blank" rel="noopener noreferrer">เปิดดูรายละเอียดการรายงาน</a></p>
              <p style="margin-top:16px;">ขอบคุณ,<br/>ระบบแจ้งเตือน MealVault</p>
            `;

            try {
              await sendEmail({
                to: adminInfo.user_email,
                subject: emailSubject,
                html: emailBody
              });
            } catch (emailErr) {
              console.error(`Error sending report email to admin ${adminId}:`, emailErr);
            }
          }
        }
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