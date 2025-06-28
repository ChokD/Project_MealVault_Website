// routes/postRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- PUBLIC ROUTES ---

// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด
// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด
router.get('/posts', async (req, res) => {
  try {
    // แก้ไขตรงนี้: เพิ่ม p.user_id เข้าไปใน SELECT
    const sql = `
      SELECT p.cpost_id, p.cpost_title, p.cpost_datetime, p.cpost_image, u.user_fname, p.user_id 
      FROM CommunityPost p 
      JOIN User u ON p.user_id = u.user_id 
      ORDER BY p.cpost_datetime DESC`;
      
    const [posts] = await db.query(sql);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});

// GET /api/posts/:id - ดึงข้อมูลโพสต์เดียว พร้อมคอมเมนต์ทั้งหมด
router.get('/posts/:id', async (req, res) => {
  try {
    const { id: postId } = req.params;

    const postSql = `
      SELECT p.*, u.user_fname 
      FROM CommunityPost p 
      JOIN User u ON p.user_id = u.user_id 
      WHERE p.cpost_id = ?`;
    const [posts] = await db.query(postSql, [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการ' });
    }

    const commentSql = `
      SELECT c.*, u.user_fname 
      FROM CommunityComment c 
      JOIN User u ON c.user_id = u.user_id 
      WHERE c.cpost_id = ? 
      ORDER BY c.comment_datetime ASC`;
    const [comments] = await db.query(commentSql, [postId]);

    const postData = {
      ...posts[0],
      comments: comments
    };

    res.json(postData);
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});


// --- PROTECTED ROUTES (ต้อง Login) ---

// POST /api/posts - สร้างโพสต์ใหม่พร้อมรูปภาพ
router.post('/posts', authMiddleware, upload.single('cpost_image'), async (req, res) => {
  const { cpost_title, cpost_content } = req.body;
  const user_id = req.user.id;

  // ลบการบังคับว่าต้องมีไฟล์ออกไป
  // if (!req.file) { ... }

  if (!cpost_title || !cpost_content) {
    return res.status(400).json({ message: 'กรุณากรอกหัวข้อและเนื้อหา' });
  }

  try {
    const newPost = {
      cpost_title,
      cpost_content,
      user_id,
      cpost_datetime: new Date(),
      // ใช้เงื่อนไข: ถ้ามีไฟล์ (req.file) ให้ใช้ชื่อไฟล์นั้น, ถ้าไม่มีให้เป็น null
      cpost_image: req.file ? req.file.filename : null, 
    };

    const sql = 'INSERT INTO CommunityPost SET ?';
    await db.query(sql, newPost);
    res.status(201).json({ message: 'สร้างโพสต์สำเร็จ' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างโพสต์' });
  }
});

// POST /api/posts/:id/comments - เพิ่มความคิดเห็นในโพสต์
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  const { id: cpost_id } = req.params;
  const { comment_content } = req.body;
  const user_id = req.user.id;

  if (!comment_content) {
    return res.status(400).json({ message: 'กรุณากรอกความคิดเห็น' });
  }
  try {
    const newComment = {
      comment_content,
      cpost_id,
      user_id,
      comment_datetime: new Date()
    };
    const sql = 'INSERT INTO CommunityComment SET ?';
    await db.query(sql, newComment);
    
    // ดึงข้อมูลคอมเมนต์ใหม่ล่าสุดกลับไปให้ Frontend
    const getNewCommentSql = `
      SELECT c.*, u.user_fname 
      FROM CommunityComment c 
      JOIN User u ON c.user_id = u.user_id 
      WHERE c.comment_id = (SELECT LAST_INSERT_ID())`;
    const [newlyCreatedComment] = await db.query(getNewCommentSql);

    res.status(201).json(newlyCreatedComment[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น' });
  }
});

// DELETE /api/posts/:id - ลบโพสต์ (สำหรับเจ้าของโพสต์ หรือ Admin)
router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { id: postIdToDelete } = req.params;

    const findPostSql = 'SELECT user_id FROM CommunityPost WHERE cpost_id = ?';
    const [posts] = await db.query(findPostSql, [postIdToDelete]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการลบ' });
    }
    const postOwnerId = posts[0].user_id;

    const adminSql = 'SELECT admin_id FROM Admin WHERE admin_id = ?';
    const [admins] = await db.query(adminSql, [loggedInUserId]);
    const isAdmin = admins.length > 0;

    if (!isAdmin && loggedInUserId !== postOwnerId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });
    }

    const deleteCommentsSql = 'DELETE FROM CommunityComment WHERE cpost_id = ?';
    await db.query(deleteCommentsSql, [postIdToDelete]);

    const deletePostSql = 'DELETE FROM CommunityPost WHERE cpost_id = ?';
    await db.query(deletePostSql, [postIdToDelete]);

    res.json({ message: 'ลบโพสต์สำเร็จ' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบโพสต์' });
  }
});

module.exports = router;