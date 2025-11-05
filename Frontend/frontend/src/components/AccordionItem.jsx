import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

// --- ฟอร์มคอมเมนต์ (เหมือนเดิม) ---
function CommentForm({ postId, onCommentAdded }) {
  const { token } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comment_content: content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถเพิ่มความคิดเห็นได้');
      
      onCommentAdded(data);
      setContent('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <textarea
        rows="4"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
        placeholder="แสดงความคิดเห็นของคุณ..."
        required
      ></textarea>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <button type="submit" className="mt-2 bg-green-500 text-white font-bold rounded-full px-6 py-2 hover:bg-green-600 transition-colors">
        ส่งความคิดเห็น
      </button>
    </form>
  );
}


// --- Accordion Item หลัก ---
function AccordionItem({ post, isOpen, onToggle, onDeleteClick, onDeleteComment }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.like_count || 0);

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const response = await fetch(`http://localhost:3000/api/posts/${post.cpost_id}`, { headers });
          if (!response.ok) {
            throw new Error('Failed to fetch post details');
          }
          const data = await response.json();
          setDetails(data);
          if (data.isLiked !== undefined) {
            setIsLiked(data.isLiked);
          }
        } catch (error) {
          console.error("Failed to fetch post details:", error);
          setDetails(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Reset details when closed to ensure fresh data on next open
        setDetails(null);
      }
    };
    
    fetchPostDetails();
  }, [isOpen, post.cpost_id, token]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!token) return alert('กรุณาเข้าสู่ระบบเพื่อกดไลค์');
    
    const originalLiked = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(current => !current);
    setLikeCount(prev => (originalLiked ? prev - 1 : prev + 1));

    try {
      await fetch(`http://localhost:3000/api/posts/${post.cpost_id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
        setIsLiked(originalLiked); 
        setLikeCount(originalLikeCount);
        alert('เกิดข้อผิดพลาดในการกดไลค์');
    }
  };

  const handleCommentAdded = async (newComment) => {
    // Re-fetch post details เพื่อให้ได้ข้อมูลคอมเมนต์ที่ถูกต้องจาก backend
    if (isOpen && token) {
      try {
        const response = await fetch(`http://localhost:3000/api/posts/${post.cpost_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data) {
          setDetails(data);
          if (data.isLiked !== undefined) {
            setIsLiked(data.isLiked);
          }
        }
      } catch (error) {
        console.error("Failed to refresh post details:", error);
        // Fallback: เพิ่มคอมเมนต์ใหม่เข้าไปใน state
        setDetails(prevDetails => ({
          ...prevDetails,
          comments: [...(prevDetails?.comments || []), newComment],
        }));
      }
    } else {
      // Fallback: เพิ่มคอมเมนต์ใหม่เข้าไปใน state
      setDetails(prevDetails => ({
        ...prevDetails,
        comments: [...(prevDetails?.comments || []), newComment],
      }));
    }
  };

  const canDeletePost = user && post && (user.isAdmin || user.user_id === post.user_id);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <div className="flex-grow cursor-pointer" onClick={onToggle}>
          <h3 className="font-bold text-lg text-gray-800">{post.cpost_title}</h3>
          <p className="text-sm text-gray-500">โพสต์โดย: {post.user_fname}</p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
            <button onClick={handleLike} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <svg className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-current' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
            </button>
            <span className="font-semibold text-gray-700 w-4 text-center">{likeCount}</span>
        </div>

        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="cursor-pointer p-2" onClick={onToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9L12 16L5 9" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t p-6">
              {isLoading && <p>กำลังโหลดรายละเอียด...</p>}
              {details && (
                <div>
                  {canDeletePost && (
                    <div className="flex justify-end mb-4">
                      {/* --- แก้ไขตรงนี้: เปลี่ยน onDeletePost เป็น onDeleteClick --- */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(details.cpost_id);
                        }}
                        className="bg-red-500 text-white font-bold text-sm rounded-full px-4 py-1 hover:bg-red-600 transition-colors"
                      >
                        ลบโพสต์นี้
                      </button>
                    </div>
                  )}
                  {details.cpost_image && (
                    <div className="mb-6 rounded-lg overflow-hidden shadow-sm">
                      <img 
                        src={`http://localhost:3000/images/${details.cpost_image}`}
                        alt={details.cpost_title}
                        className="w-full h-auto max-h-96 object-contain bg-gray-100"
                        style={{ maxWidth: '100%', height: 'auto' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/800x400.png?text=MealVault';
                        }}
                      />
                    </div>
                  )}
                  <div className="prose max-w-none mb-8 text-gray-700" style={{whiteSpace: 'pre-wrap'}}>
                    {details.cpost_content}
                  </div>
                  <hr className="my-6"/>
                  <h4 className="font-bold text-lg mb-4">ความคิดเห็น ({details.comments?.length || 0})</h4>
                  <div className="space-y-4">
                    {details.comments?.map(comment => (
                      <div key={comment.comment_id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                         <div>
                            <p className="font-semibold text-sm text-gray-800">{comment.user_fname}</p>
                            <p className="text-gray-600">{comment.comment_content || comment.comment_text}</p>
                         </div>
                         {user && user.isAdmin && (
                            <button
                                onClick={() => onDeleteComment(comment.comment_id)}
                                className="text-xs text-red-600 hover:underline ml-2 flex-shrink-0"
                                title="ลบคอมเมนต์นี้"
                            >
                                ลบ
                            </button>
                         )}
                      </div>
                    ))}
                     {details.comments?.length === 0 && <p className="text-gray-500">ยังไม่มีความคิดเห็น</p>}
                  </div>
                  {token ? (
                    <CommentForm postId={post.cpost_id} onCommentAdded={handleCommentAdded} />
                  ) : (
                    <p className="mt-8 text-center text-gray-500">กรุณา <a href="/login" className="text-green-600 font-bold hover:underline">เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AccordionItem;