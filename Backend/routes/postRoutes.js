// routes/postRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware'); // นำเข้าด่านตรวจ

// --- API ส่วนที่ทุกคนเข้าถึงได้ (Public) ---

// 1. ดึงข้อมูลโพสต์ทั้งหมด
router.get('/posts', async (req, res) => {
  try {
    const sql = `
      SELECT p.cpost_id, p.cpost_title, p.cpost_datetime, u.user_fname 
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

// 2. ดึงข้อมูลโพสต์เดียว พร้อมคอมเมนต์ทั้งหมด
router.get('/posts/:id', async (req, res) => {
  try {
    const { id: postId } = req.params;

    // ดึงข้อมูลโพสต์หลัก
    const postSql = `
      SELECT p.*, u.user_fname 
      FROM CommunityPost p 
      JOIN User u ON p.user_id = u.user_id 
      WHERE p.cpost_id = ?`;
    const [posts] = await db.query(postSql, [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ message: 'ไม่พบโพสต์ที่ต้องการ' });
    }

    // ดึงคอมเมนต์ของโพสต์นั้นๆ
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


// --- API ส่วนที่ต้อง Login ก่อน (Protected) ---

// 3. สร้างโพสต์ใหม่
router.post('/posts', authMiddleware, async (req, res) => {
  const { cpost_title, cpost_content } = req.body;
  const user_id = req.user.id; // ดึง user_id จาก Token

  if (!cpost_title || !cpost_content) {
    return res.status(400).json({ message: 'กรุณากรอกหัวข้อและเนื้อหา' });
  }
  try {
    const newPost = {
      cpost_title,
      cpost_content,
      user_id,
      cpost_datetime: new Date()
    };
    const sql = 'INSERT INTO CommunityPost SET ?';
    await db.query(sql, newPost);
    res.status(201).json({ message: 'สร้างโพสต์สำเร็จ' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างโพสต์' });
  }
});

// 4. เพิ่มความคิดเห็นในโพสต์
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
    res.status(201).json({ message: 'เพิ่มความคิดเห็นสำเร็จ' });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น' });
  }
});

module.exports = router;