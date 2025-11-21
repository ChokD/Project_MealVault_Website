import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import ReportModal from './ReportModal';
import { useNavigate } from 'react-router-dom';

// --- ฟอร์มคอมเมนต์ (เหมือนเดิม) ---
function CommentForm({ postId, onCommentAdded }) {
  const { token, user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  
  const isAdmin = user?.isAdmin || false;

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
      <button 
        type="submit" 
        className={`mt-2 ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold rounded-full px-6 py-2 transition-colors`}
      >
        ส่งความคิดเห็น
      </button>
    </form>
  );
}


// --- Accordion Item หลัก ---
function AccordionItem({ post, isOpen, onToggle, onDeleteClick, onDeleteComment, highlightedCommentId, isReported }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.like_count || 0);
  
  // State สำหรับ Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportCommentId, setReportCommentId] = useState(null);

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

  // Scroll ไปที่คอมเมนต์ที่ highlight เมื่อ details โหลดเสร็จ
  useEffect(() => {
    if (highlightedCommentId && isOpen && details && details.comments) {
      console.log('AccordionItem - Highlighting comment:', highlightedCommentId);
      console.log('AccordionItem - Comments:', details.comments.map(c => c.comment_id));
      const scrollTimeout = setTimeout(() => {
        const commentElement = document.getElementById(`comment-${highlightedCommentId}`);
        console.log('AccordionItem - Comment element:', commentElement);
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.error('AccordionItem - Comment element not found:', `comment-${highlightedCommentId}`);
        }
      }, 1200); // รอให้โพสต์เปิดและคอมเมนต์โหลดเสร็จ
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [highlightedCommentId, isOpen, details]);

  // Debug log สำหรับ highlight props
  useEffect(() => {
    if (isReported || highlightedCommentId) {
      console.log('AccordionItem - Highlight props:', {
        postId: post.cpost_id,
        isReported,
        highlightedCommentId,
        isOpen
      });
    }
  }, [isReported, highlightedCommentId, isOpen, post.cpost_id]);

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

  // ตรวจสอบสิทธิ์จาก details (เมื่อโหลดเสร็จแล้ว) หรือจาก post (ตอนเริ่มต้น)
  const postUserId = details?.user_id || post?.user_id;
  const canDeletePost = user && (user.isAdmin || user.user_id === postUserId);
  const canEditPost = user && (user.isAdmin || user.user_id === postUserId);
  const isAdmin = user?.isAdmin || false;
  const isRecipe = (details?.post_type || post?.post_type) === 'recipe';
  const recipeDetails = details?.recipe || post?.recipe || null;
  const ingredientsList = Array.isArray(recipeDetails?.ingredients) ? recipeDetails.ingredients : [];
  const stepsList = Array.isArray(recipeDetails?.steps) ? recipeDetails.steps : [];
  const formatDateTime = (value) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return null;
    }
  };
  const postCreatedAt = formatDateTime(details?.cpost_datetime || post?.cpost_datetime);
  const handleAuthorClick = (e) => {
    e.stopPropagation();
    const ownerId = post?.user_id || details?.user_id;
    if (ownerId) {
      navigate(`/users/${ownerId}`);
    }
  };

  // ฟังก์ชันสำหรับเปิด Modal รายงานโพสต์
  const handleReportPost = (e) => {
    e.stopPropagation();
    if (!token) {
      alert('กรุณาเข้าสู่ระบบเพื่อรายงานโพสต์');
      return;
    }
    setReportPostId(post.cpost_id);
    setReportCommentId(null);
    setIsReportModalOpen(true);
  };

  // ฟังก์ชันสำหรับเปิด Modal รายงานคอมเมนต์
  const handleReportComment = (e, commentId) => {
    e.stopPropagation();
    if (!token) {
      alert('กรุณาเข้าสู่ระบบเพื่อรายงานคอมเมนต์');
      return;
    }
    setReportPostId(null);
    setReportCommentId(commentId);
    setIsReportModalOpen(true);
  };

  // ฟังก์ชันสำหรับปิด Modal รายงาน
  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportPostId(null);
    setReportCommentId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 flex justify-between items-center">
        <div className="flex-grow cursor-pointer" onClick={onToggle}>
          <h3 className="font-bold text-lg text-gray-800">{post.cpost_title}</h3>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <button
              type="button"
              onClick={handleAuthorClick}
              className="text-sm text-emerald-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded"
            >
              โพสต์โดย: {post.user_fname}
            </button>
            {isRecipe && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                สูตรอาหาร
              </span>
            )}
            {postCreatedAt && (
              <span className="text-xs text-gray-500">โพสต์เมื่อ: {postCreatedAt}</span>
            )}
          </div>
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
                  <div className="flex justify-between items-center mb-4">
                    {/* ปุ่มรายงานโพสต์ */}
                    {token && (
                      <button
                        onClick={handleReportPost}
                        className="text-gray-500 hover:text-red-500 text-sm flex items-center gap-1 transition-colors"
                        title="รายงานโพสต์นี้"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>รายงาน</span>
                      </button>
                    )}
                    
                    {/* ปุ่มแก้ไข/ลบโพสต์ */}
                    {(canEditPost || canDeletePost) && (
                      <div className="flex justify-end gap-2">
                        {canEditPost && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/edit-post/${details.cpost_id}`;
                            }}
                            className={`${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold text-sm rounded-full px-4 py-1 transition-colors`}
                          >
                            แก้ไขโพสต์
                          </button>
                        )}
                        {canDeletePost && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClick(details.cpost_id);
                            }}
                            className="bg-red-500 text-white font-bold text-sm rounded-full px-4 py-1 hover:bg-red-600 transition-colors"
                          >
                            ลบโพสต์นี้
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const mediaList = Array.isArray(details?.cpost_images) && details.cpost_images.length > 0
                      ? details.cpost_images
                      : details?.cpost_image
                        ? [details.cpost_image]
                        : [];
                    if (mediaList.length === 0) return null;
                    if (mediaList.length === 1) {
                      const src = mediaList[0].startsWith('http')
                        ? mediaList[0]
                        : `http://localhost:3000/images/${mediaList[0]}`;
                      return (
                        <div className="mb-6 rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={src}
                            alt={details.cpost_title}
                            className="w-full h-auto max-h-96 object-contain bg-gray-100"
                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x400.png?text=MealVault'; }}
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className={`grid gap-3 p-3 ${mediaList.length === 2 ? 'grid-cols-2' : 'grid-cols-2 auto-rows-[160px]'}`}>
                          {mediaList.slice(0, 4).map((image, idx) => {
                            const src = image.startsWith('http') ? image : `http://localhost:3000/images/${image}`;
                            const isFirstLarge = mediaList.length === 3 && idx === 0;
                            const isLastOverlay = mediaList.length > 4 && idx === 3;
                            return (
                              <div
                                key={`${image}-${idx}`}
                                className={`relative overflow-hidden rounded-xl ${isFirstLarge ? 'col-span-2 row-span-2' : ''}`}
                              >
                                <img
                                  src={src}
                                  alt={`รูปที่ ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x400.png?text=MealVault'; }}
                                />
                                {isLastOverlay && (
                                  <div className="absolute inset-0 bg-black/50 text-white text-xl font-semibold flex items-center justify-center">
                                    +{mediaList.length - 4}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="prose max-w-none mb-8 text-gray-700" style={{whiteSpace: 'pre-wrap'}}>
                    {isRecipe ? (
                      <>
                        {recipeDetails?.recipe_summary && (
                          <p className="text-gray-700 leading-relaxed mb-6">
                            {recipeDetails.recipe_summary}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {recipeDetails?.recipe_category && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                              <p className="text-gray-500">หมวดหมู่</p>
                              <p className="font-semibold text-gray-800">{recipeDetails.recipe_category}</p>
                            </div>
                          )}
                          {recipeDetails?.servings && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                              <p className="text-gray-500">จำนวนเสิร์ฟ</p>
                              <p className="font-semibold text-gray-800">{recipeDetails.servings} คน</p>
                            </div>
                          )}
                          {recipeDetails?.prep_time_minutes && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                              <p className="text-gray-500">เวลาเตรียม</p>
                              <p className="font-semibold text-gray-800">{recipeDetails.prep_time_minutes} นาที</p>
                            </div>
                          )}
                          {recipeDetails?.cook_time_minutes && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                              <p className="text-gray-500">เวลาปรุง</p>
                              <p className="font-semibold text-gray-800">{recipeDetails.cook_time_minutes} นาที</p>
                            </div>
                          )}
                          {recipeDetails?.total_time_minutes && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                              <p className="text-gray-500">เวลารวม</p>
                              <p className="font-semibold text-gray-800">{recipeDetails.total_time_minutes} นาที</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">วัตถุดิบ</h4>
                            {ingredientsList.length > 0 ? (
                              <ul className="space-y-2">
                                {ingredientsList.map((item, idx) => {
                                  const name = item?.name || item?.ingredient || item?.title || item?.item || item?.label || `วัตถุดิบที่ ${idx + 1}`;
                                  const amount = item?.amount || item?.quantity || item?.value || item?.measure || '';
                                  return (
                                    <li key={idx} className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-700 flex justify-between gap-4">
                                      <span>{name}</span>
                                      {amount && <span className="text-gray-500">{amount}</span>}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">ไม่มีข้อมูลวัตถุดิบ</p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-3">ขั้นตอนการทำ</h4>
                            {stepsList.length > 0 ? (
                              <ol className="space-y-3 list-decimal list-inside">
                                {stepsList.map((item, idx) => {
                                  const text = typeof item === 'string' ? item : item?.detail || item?.description || item?.text || '';
                                  const order = item?.order || item?.step || idx + 1;
                                  return (
                                    <li key={idx} className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                                      <span className="font-medium text-gray-700 block mb-1">ขั้นตอนที่ {order}</span>
                                      <span className="text-gray-600 leading-relaxed">{text}</span>
                                    </li>
                                  );
                                })}
                              </ol>
                            ) : (
                              <p className="text-sm text-gray-500">ไม่มีข้อมูลขั้นตอน</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>{details.cpost_content}</>
                    )}
                  </div>
                  <hr className="my-6"/>
                  <h4 className="font-bold text-lg mb-4">ความคิดเห็น ({details.comments?.length || 0})</h4>
                  <div className="space-y-4">
                    {details.comments?.map(comment => {
                      // ตรวจสอบว่าเป็นเจ้าของคอมเมนต์หรือ Admin
                      const canDeleteComment = user && (user.isAdmin || user.user_id === comment.user_id);
                      const isHighlightedComment = highlightedCommentId === comment.comment_id && isReported;
                      
                      return (
                        <div 
                          key={comment.comment_id} 
                          id={`comment-${comment.comment_id}`}
                          className={`p-3 rounded-lg flex justify-between items-start gap-2 transition-all duration-500 ${
                            isHighlightedComment 
                              ? 'bg-red-100 border-2 border-red-500 ring-2 ring-red-300 shadow-lg' 
                              : 'bg-gray-50'
                          }`}
                          style={isHighlightedComment ? { animation: 'pulse 2s ease-in-out 3' } : {}}
                        >
                           <div className="flex-grow">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (comment.user_id) {
                                      navigate(`/users/${comment.user_id}`);
                                    }
                                  }}
                                  className="font-semibold text-sm text-gray-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded"
                                >
                                  {comment.user_fname}
                                </button>
                                {comment.comment_datetime && (
                                  <span className="text-xs text-gray-500">
                                    แสดงความคิดเห็นเมื่อ: {formatDateTime(comment.comment_datetime)}
                                  </span>
                                )}
                                {isHighlightedComment && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
                                    ⚠️ ถูกรายงาน
                                  </span>
                                )}
                              </div>
                              <p className={`mt-1 ${isHighlightedComment ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                                {comment.comment_content || comment.comment_text}
                              </p>
                           </div>
                           <div className="flex items-center gap-2 flex-shrink-0">
                              {/* ปุ่มรายงานคอมเมนต์ */}
                              {token && (
                                <button
                                  onClick={(e) => handleReportComment(e, comment.comment_id)}
                                  className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                                  title="รายงานคอมเมนต์นี้"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </button>
                              )}
                              {/* ปุ่มลบคอมเมนต์ */}
                              {canDeleteComment && (
                                <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteComment(comment.comment_id);
                                    }}
                                    className="text-xs text-red-600 hover:underline px-2 py-1 hover:bg-red-50 rounded"
                                    title="ลบคอมเมนต์นี้"
                                >
                                    ลบ
                                </button>
                              )}
                           </div>
                        </div>
                      );
                    })}
                     {details.comments?.length === 0 && <p className="text-gray-500">ยังไม่มีความคิดเห็น</p>}
                  </div>
                  {token ? (
                    <CommentForm postId={post.cpost_id} onCommentAdded={handleCommentAdded} />
                  ) : (
                    <p className="mt-8 text-center text-gray-500">กรุณา <a href="/login" className={`${isAdmin ? 'text-red-600' : 'text-green-600'} font-bold hover:underline`}>เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        cpostId={reportPostId}
        commentId={reportCommentId}
        onReportSubmitted={() => {
          console.log('Report submitted successfully');
        }}
      />
    </div>
  );
}

export default AccordionItem;