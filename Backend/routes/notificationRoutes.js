const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// Helper function: สร้าง notification
async function createNotification({
  notification_type,
  notification_message,
  user_id,
  cpost_id = null,
  comment_id = null,
  actor_user_id = null,
  creport_id = null
}) {
  try {
    const notification = {
      notification_id: 'NT' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
      notification_type,
      notification_message,
      user_id,
      cpost_id,
      comment_id,
      actor_user_id,
      creport_id,
      is_read: false,
      notification_datetime: new Date().toISOString()
    };

    const { error } = await supabase
      .from('Notification')
      .insert([notification]);

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// GET /api/notifications - ดึง notifications ของ user ปัจจุบัน
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ดึง notifications ของ user
    const { data: notifications, error } = await supabase
      .from('Notification')
      .select(`
        *,
        ActorUser:actor_user_id (user_fname, user_lname),
        Post:cpost_id (cpost_id, cpost_title),
        Comment:comment_id (comment_id, comment_text),
        Report:creport_id (
          creport_id,
          creport_type,
          creport_details,
          cpost_id,
          comment_id,
          User:user_id (user_fname, user_lname),
          CommunityPost:cpost_id (cpost_id, cpost_title)
        )
      `)
      .eq('user_id', user_id)
      .order('notification_datetime', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // สำหรับ notification ที่เป็น report type แต่ไม่มี Report object
    // ให้ query Report จาก database แยก
    const reportNotifications = (notifications || []).filter(n => 
      n.notification_type === 'report' && n.creport_id && !n.Report
    );
    
    if (reportNotifications.length > 0) {
      const reportIds = reportNotifications.map(n => n.creport_id).filter(Boolean);
      if (reportIds.length > 0) {
        const { data: reports, error: reportError } = await supabase
          .from('CommunityReport')
          .select(`
            creport_id,
            creport_type,
            creport_details,
            cpost_id,
            comment_id,
            User:user_id (user_fname, user_lname),
            CommunityPost:cpost_id (cpost_id, cpost_title)
          `)
          .in('creport_id', reportIds);
        
        if (!reportError && reports) {
          // สร้าง map ของ reports
          const reportMap = new Map();
          reports.forEach(report => {
            reportMap.set(report.creport_id, report);
          });
          
          // เพิ่ม Report object ให้กับ notification ที่ไม่มี
          notifications.forEach(notification => {
            if (notification.notification_type === 'report' && 
                notification.creport_id && 
                !notification.Report &&
                reportMap.has(notification.creport_id)) {
              notification.Report = reportMap.get(notification.creport_id);
            }
          });
        }
      }
    }

    // แปลงข้อมูลให้ Frontend ใช้งานง่าย
    const formattedNotifications = (notifications || []).map(notification => {
      // สำหรับ report type, ใช้ cpost_id และ comment_id จาก Report เป็นหลัก
      // เพราะ notification อาจไม่มี cpost_id (notification เก่า)
      let finalCpostId = notification.cpost_id;
      let finalCommentId = notification.comment_id;
      
      // Debug log
      console.log('Processing notification:', {
        notification_id: notification.notification_id,
        notification_type: notification.notification_type,
        notification_cpost_id: notification.cpost_id,
        notification_comment_id: notification.comment_id,
        creport_id: notification.creport_id,
        hasReport: !!notification.Report,
        report_cpost_id: notification.Report?.cpost_id,
        report_comment_id: notification.Report?.comment_id
      });
      
      // สำหรับ report type, ใช้ cpost_id และ comment_id จาก Report เป็นหลัก
      // เพราะ Report มีข้อมูลที่ถูกต้องเสมอ
      if (notification.notification_type === 'report') {
        if (notification.Report) {
          // ใช้จาก Report เป็นหลัก (เพราะ Report มีข้อมูลที่ถูกต้องเสมอ)
          finalCpostId = notification.Report.cpost_id || notification.cpost_id || null;
          finalCommentId = notification.Report.comment_id || notification.comment_id || null;
          
          console.log('Using Report object:', {
            report_cpost_id: notification.Report.cpost_id,
            report_comment_id: notification.Report.comment_id,
            notification_cpost_id: notification.cpost_id,
            notification_comment_id: notification.comment_id,
            finalCpostId,
            finalCommentId
          });
        } else if (notification.creport_id) {
          // ถ้าไม่มี Report object แต่มี creport_id
          // นี่ไม่ควรเกิดขึ้นเพราะเรา query Report แยกแล้ว
          // แต่ถ้าเกิดจริง อาจเป็นเพราะ Report ถูกลบไปแล้ว
          console.error(`ERROR: Notification ${notification.notification_id} has creport_id (${notification.creport_id}) but no Report object after query`);
          console.error('This should not happen. Report might have been deleted.');
          
          // ใช้จาก notification (อาจเป็น notification เก่าที่ไม่มีข้อมูล)
          finalCpostId = notification.cpost_id || null;
          finalCommentId = notification.comment_id || null;
        } else {
          // ถ้าไม่มี Report object และไม่มี creport_id
          // นี่คือ notification ที่มีปัญหา (notification เก่าที่สร้างผิด)
          console.error(`ERROR: Notification ${notification.notification_id} is report type but has no creport_id and no Report object`);
          console.error('This notification cannot be linked to a post. It should be deleted or recreated.');
          
          finalCpostId = notification.cpost_id || null;
          finalCommentId = notification.comment_id || null;
        }
      }
      
      console.log('Final values for notification:', {
        notification_id: notification.notification_id,
        notification_type: notification.notification_type,
        finalCpostId,
        finalCommentId,
        hasReport: !!notification.Report,
        hasCreportId: !!notification.creport_id,
        fromReport: notification.notification_type === 'report' && notification.Report ? true : false
      });
      
      return {
        ...notification,
        cpost_id: finalCpostId, // ใช้ค่า cpost_id ที่ถูกต้อง (จาก Report หรือ notification)
        comment_id: finalCommentId, // ใช้ค่า comment_id ที่ถูกต้อง (จาก Report หรือ notification)
        actor_fname: notification.ActorUser?.user_fname || null,
        post_title: notification.Post?.cpost_title || notification.Report?.CommunityPost?.cpost_title || null,
        comment_text: notification.Comment?.comment_text || null,
        report_data: notification.Report ? {
          creport_id: notification.Report.creport_id,
          creport_type: notification.Report.creport_type,
          creport_details: notification.Report.creport_details,
          reporter_fname: notification.Report.User?.user_fname || null,
          post_title: notification.Report.CommunityPost?.cpost_title || null,
          cpost_id: finalCpostId, // ใช้ค่าเดียวกันกับ notification
          comment_id: finalCommentId // ใช้ค่าเดียวกันกับ notification
        } : null,
        ActorUser: undefined,
        Post: undefined,
        Comment: undefined,
        Report: undefined
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งเตือน' });
  }
});

// GET /api/notifications/unread-count - ดึงจำนวน notifications ที่ยังไม่อ่าน
router.get('/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    res.json({ unreadCount: count || 0 });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงจำนวนแจ้งเตือน' });
  }
});

// PUT /api/notifications/:id/read - ทำเครื่องหมายว่าอ่านแล้ว
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id: notification_id } = req.params;
    const user_id = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // ตรวจสอบว่า notification เป็นของ user นี้หรือไม่
    const { data: notification, error: findError } = await supabase
      .from('Notification')
      .select('user_id')
      .eq('notification_id', notification_id)
      .limit(1);

    if (findError) {
      console.error('Supabase query error:', findError);
      throw findError;
    }

    if (!notification || notification.length === 0) {
      return res.status(404).json({ message: 'ไม่พบแจ้งเตือน' });
    }

    if (notification[0].user_id !== user_id) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงแจ้งเตือนนี้' });
    }

    // อัพเดทสถานะเป็นอ่านแล้ว
    const { error: updateError } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('notification_id', notification_id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    res.json({ message: 'อัพเดทสถานะแจ้งเตือนสำเร็จ' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทแจ้งเตือน' });
  }
});

// PUT /api/notifications/read-all - ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
router.put('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.id;

    if (!supabase) {
      console.error('Supabase client is not initialized');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // อัพเดทสถานะเป็นอ่านแล้วทั้งหมด
    const { error: updateError } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    res.json({ message: 'อัพเดทสถานะแจ้งเตือนทั้งหมดสำเร็จ' });
  } catch (error) {
    console.error('Error updating all notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทแจ้งเตือน' });
  }
});

// Export function สำหรับใช้ใน routes อื่น
module.exports = router;
module.exports.createNotification = createNotification;

