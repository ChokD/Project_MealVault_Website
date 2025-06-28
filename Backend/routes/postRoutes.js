const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- PUBLIC ROUTES ---

// GET /api/posts - ดึงข้อมูลโพสต์ทั้งหมด (เพิ่ม like_count)
router.get('/posts', async (req, res) => {
  try {
    const sql = `
      SELECT p.cpost_id, p.cpost_title, p.cpost_datetime, p.cpost_image, p.like_count, u.user_fname, p.user_id 
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

// GET /api/posts/:id - ดึงข้อมูลโพสต์เดียว (ต้อง Login เพื่อดูสถานะไลค์)
router.get('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const loggedInUserId = req.user.id; // ID ของผู้ใช้ที่กำลังดู

    // ดึงข้อมูลโพสต์หลัก
    const postSql = `
      SELECT p.*, u.user_fname 
      FROM CommunityPost p JOIN User u ON p.user_id = u.user_id 
      WHERE p.cpost_id = ?`;
    const [posts] = await db.query(postSql, [postId]);
    if (posts.length === 0) return res.status(404).json({ message: 'ไม่พบโพสต์' });

    // ดึงคอมเมนต์
    const commentSql = `
      SELECT c.*, u.user_fname 
      FROM CommunityComment c 
      JOIN User u ON c.user_id = u.user_id 
      WHERE c.cpost_id = ? 
      ORDER BY c.comment_datetime ASC`;
    const [comments] = await db.query(commentSql, [postId]);

    // ตรวจสอบว่าผู้ใช้คนนี้เคยกดไลค์โพสต์นี้หรือยัง
    const likeSql = 'SELECT * FROM PostLike WHERE post_id = ? AND user_id = ?';
    const [likes] = await db.query(likeSql, [postId, loggedInUserId]);

    const postData = {
      ...posts[0],
      comments: comments,
      isLiked: likes.length > 0 // เพิ่ม key ใหม่: ถ้าเจอข้อมูลไลค์จะเป็น true
    };
    res.json(postData);
  } catch (error) {
    console.error('Error fetching single post:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์' });
  }
});


// --- PROTECTED ROUTES ---

// POST /api/posts - สร้างโพสต์ใหม่พร้อมรูปภาพ
router.post('/posts', authMiddleware, upload.single('cpost_image'), async (req, res) => {
  const { cpost_title, cpost_content } = req.body;
  const user_id = req.user.id;

  if (!cpost_title || !cpost_content) {
    return res.status(400).json({ message: 'กรุณากรอกหัวข้อและเนื้อหา' });
  }

  try {
    const newPost = {
      cpost_title,
      cpost_content,
      user_id,
      cpost_datetime: new Date(),
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

// POST /api/posts/:id/like - สำหรับกดไลค์/ยกเลิกไลค์
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const connection = await db.getConnection(); // ใช้ Transaction เพื่อความปลอดภัย
    try {
        await connection.beginTransaction();

        const [likes] = await connection.query('SELECT * FROM PostLike WHERE post_id = ? AND user_id = ?', [postId, userId]);

        if (likes.length > 0) {
            // ถ้าเคยไลค์แล้ว -> ให้ยกเลิกไลค์ (Unlike)
            await connection.query('DELETE FROM PostLike WHERE post_id = ? AND user_id = ?', [postId, userId]);
            await connection.query('UPDATE CommunityPost SET like_count = like_count - 1 WHERE cpost_id = ? AND like_count > 0', [postId]);
            await connection.commit();
            res.json({ message: 'ยกเลิกไลค์สำเร็จ', liked: false });
        } else {
            // ถ้ายังไม่เคยไลค์ -> ให้กดไลค์ (Like)
            await connection.query('INSERT INTO PostLike (post_id, user_id) VALUES (?, ?)', [postId, userId]);
            await connection.query('UPDATE CommunityPost SET like_count = like_count + 1 WHERE cpost_id = ?', [postId]);
            await connection.commit();
            res.json({ message: 'ไลค์สำเร็จ', liked: true });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    } finally {
        connection.release();
    }
});


module.exports = router;