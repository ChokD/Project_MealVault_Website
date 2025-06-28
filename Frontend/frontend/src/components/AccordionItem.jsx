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

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (isOpen && !details) {
        setIsLoading(true);
        try {
          const response = await fetch(`http://localhost:3000/api/posts/${post.cpost_id}`);
          const data = await response.json();
          setDetails(data);
        } catch (error) {
          console.error("Failed to fetch post details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchPostDetails();
  }, [isOpen]);

  const handleCommentAdded = (newComment) => {
    setDetails(prevDetails => ({
      ...prevDetails,
      comments: [...prevDetails.comments, newComment],
    }));
  };

  const canDeletePost = user && post && (user.isAdmin || user.user_id === post.user_id);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div 
        className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div>
          <h3 className="font-bold text-lg text-gray-800">{post.cpost_title}</h3>
          <p className="text-sm text-gray-500">โพสต์โดย: {post.user_fname}</p>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
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

                  <img 
                    src={details.cpost_image ? `http://localhost:3000/images/${details.cpost_image}` : 'https://via.placeholder.com/800x400.png?text=MealVault'}
                    alt={details.cpost_title}
                    className="w-full h-auto max-h-96 object-cover rounded-lg mb-6 shadow-sm"
                  />
                  <div className="prose max-w-none mb-8 text-gray-700" style={{whiteSpace: 'pre-wrap'}}>
                    {details.cpost_content}
                  </div>
                  
                  <hr className="my-6"/>

                  <h4 className="font-bold text-lg mb-4">ความคิดเห็น ({details.comments.length})</h4>
                  <div className="space-y-4">
                    {details.comments.map(comment => (
                      <div key={comment.comment_id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                         <div>
                            <p className="font-semibold text-sm text-gray-800">{comment.user_fname}</p>
                            <p className="text-gray-600">{comment.comment_content}</p>
                         </div>
                         {/* --- ส่วนที่แก้ไข: เพิ่มปุ่มลบคอมเมนต์สำหรับ Admin กลับเข้ามา --- */}
                         {user && user.isAdmin && (
                            <button
                                onClick={() => onDeleteComment(comment.comment_id)}
                                className="text-xs text-red-600 hover:underline ml-2 flex-shrink-0"
                                title="ลบคอมเมนต์นี้"
                            >
                                ลบ
                            </button>
                         )}
                         {/* ---------------------------------------------------------------- */}
                      </div>
                    ))}
                     {details.comments.length === 0 && <p>ยังไม่มีความคิดเห็น</p>}
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