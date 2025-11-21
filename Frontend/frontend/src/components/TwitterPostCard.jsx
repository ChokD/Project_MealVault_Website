import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReportModal from './ReportModal';

function TwitterPostCard({ post, onDeleteClick, onDeleteComment, highlightedCommentId, isReported }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.like_count || 0);
  const [commentCount, setCommentCount] = useState(0);
  
  // State สำหรับ Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportCommentId, setReportCommentId] = useState(null);

  // โหลดรายละเอียดโพสต์เมื่อ component mount
  useEffect(() => {
    const fetchPostDetails = async () => {
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
        if (data.comments) {
          setCommentCount(data.comments.length);
        }
      } catch (error) {
        console.error("Failed to fetch post details:", error);
        setDetails(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPostDetails();
  }, [post.cpost_id, token]);

  // Scroll ไปที่คอมเมนต์ที่ highlight
  useEffect(() => {
    if (highlightedCommentId && showComments && details && details.comments) {
      const scrollTimeout = setTimeout(() => {
        const commentElement = document.getElementById(`comment-${highlightedCommentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [highlightedCommentId, showComments, details]);

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

  const handleCommentClick = (e) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/community?post=${post.cpost_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.cpost_title,
          text: post.cpost_content || post.cpost_title,
          url: postUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          // ถ้า share ไม่สำเร็จ ให้ copy link แทน
          copyToClipboard(postUrl);
        }
      }
    } else {
      // ถ้า browser ไม่รองรับ share API ให้ copy link
      copyToClipboard(postUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('คัดลอกลิงก์โพสต์แล้ว!');
    }).catch(() => {
      alert('ไม่สามารถคัดลอกลิงก์ได้');
    });
  };

  const handleCommentAdded = async (newComment) => {
    // Re-fetch post details
    if (token) {
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
          if (data.comments) {
            setCommentCount(data.comments.length);
          }
        }
      } catch (error) {
        console.error("Failed to refresh post details:", error);
        setDetails(prevDetails => ({
          ...prevDetails,
          comments: [...(prevDetails?.comments || []), newComment],
        }));
        setCommentCount(prev => prev + 1);
      }
    }
  };

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

  const formatDateTime = (value) => {
    if (!value) return null;
    try {
      const date = new Date(value);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'เมื่อสักครู่';
      if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
      if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
      
      return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const postCreatedAt = formatDateTime(post?.cpost_datetime || details?.cpost_datetime);
  const postUserId = details?.user_id || post?.user_id;
  const canDeletePost = user && (user.isAdmin || user.user_id === postUserId);
  const canEditPost = user && (user.isAdmin || user.user_id === postUserId);
  const isAdmin = user?.isAdmin || false;

  const buildImageList = () => {
    if (details?.cpost_images && details.cpost_images.length > 0) return details.cpost_images;
    if (post?.cpost_images && post.cpost_images.length > 0) return post.cpost_images;
    if (details?.cpost_image) return [details.cpost_image];
    if (post?.cpost_image) return [post.cpost_image];
    return [];
  };

  const imageList = buildImageList();
  const resolveImageUrl = (value) => {
    if (!value) return null;
    return value.startsWith('http') ? value : `http://localhost:3000/images/${value}`;
  };

  // Avatar: prefer user's uploaded profile image, fall back to generated initials avatar
  const userImageFilename = details?.user_image || post.user_image || null;
  const avatarUrl = userImageFilename
    ? `http://localhost:3000/images/${userImageFilename}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user_fname || 'User')}&background=10b981&color=fff&size=128`;

  return (
    <article 
      id={`post-${post.cpost_id}`}
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
        isReported ? 'bg-red-50 border-red-300' : 'bg-white'
      }`}
    >
      <div className="px-4 py-3">
        {isReported && (
          <div className="mb-3 px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg inline-block">
            ⚠️ โพสต์นี้ถูกรายงาน
          </div>
        )}
        
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (postUserId) {
                  navigate(`/users/${postUserId}`);
                }
              }}
              className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 hover:opacity-80 transition-opacity"
            >
              <img 
                src={avatarUrl} 
                alt={post.user_fname || 'User'}
                className="w-full h-full object-cover"
              />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (postUserId) {
                    navigate(`/users/${postUserId}`);
                  }
                }}
                className="font-bold text-gray-900 hover:underline text-[15px]"
              >
                {post.user_fname || 'ผู้ใช้'}
              </button>
              <span className="text-gray-500 text-sm">@{post.user_fname?.toLowerCase().replace(/\s+/g, '') || 'user'}</span>
              {postCreatedAt && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500 text-sm">{postCreatedAt}</span>
                </>
              )}
              {token && (
                <>
                  <span className="text-gray-500">·</span>
                  <button
                    onClick={handleReportPost}
                    className="text-gray-500 hover:text-red-500 text-sm"
                    title="รายงานโพสต์"
                  >
                    รายงาน
                  </button>
                </>
              )}
              {(canEditPost || canDeletePost) && (
                <>
                  <span className="text-gray-500">·</span>
                  {canEditPost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit-post/${post.cpost_id}`);
                      }}
                      className="text-gray-500 hover:text-blue-500 text-sm"
                    >
                      แก้ไข
                    </button>
                  )}
                  {canDeletePost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(post.cpost_id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ลบ
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Post Content */}
            <div className="mb-3">
              {details?.cpost_content && (
                <p className="text-gray-900 whitespace-pre-wrap break-words text-[15px] leading-6 mb-2">{details.cpost_content}</p>
              )}
              {!details?.cpost_content && post.cpost_title && (
                <p className="text-gray-900 text-[15px] leading-6 mb-2">{post.cpost_title}</p>
              )}
              
              {imageList.length > 0 && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  {imageList.length === 1 ? (
                    <img
                      src={resolveImageUrl(imageList[0])}
                      alt="รูปจากโพสต์"
                      className="w-full h-auto max-h-[500px] object-cover"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x400.png?text=MealVault'; }}
                    />
                  ) : (
                    <div className={`grid gap-2 p-2 ${imageList.length === 2 ? 'grid-cols-2' : 'grid-cols-2 auto-rows-[150px] sm:auto-rows-[200px]'}`}>
                      {imageList.slice(0, 4).map((image, idx) => {
                        const isFirstLarge = imageList.length === 3 && idx === 0;
                        const isLastOverlay = imageList.length > 4 && idx === 3;
                        return (
                          <div
                            key={`${image}-${idx}`}
                            className={`relative overflow-hidden rounded-xl border border-white ${isFirstLarge ? 'col-span-2 row-span-2' : ''}`}
                          >
                            <img
                              src={resolveImageUrl(image)}
                              alt={`รูปที่ ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x400.png?text=MealVault'; }}
                            />
                            {isLastOverlay && (
                              <div className="absolute inset-0 bg-black/50 text-white text-2xl font-bold flex items-center justify-center">
                                +{imageList.length - 4}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Recipe Details */}
              {details?.post_type === 'recipe' && details?.recipe && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">{details.recipe.recipe_summary}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    {details.recipe.recipe_category && (
                      <span>หมวดหมู่: {details.recipe.recipe_category}</span>
                    )}
                    {details.recipe.total_time_minutes && (
                      <span>เวลา: {details.recipe.total_time_minutes} นาที</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between max-w-md text-gray-500 mt-3">
              {/* Comment Button */}
              <button
                onClick={handleCommentClick}
                className="flex items-center gap-1 hover:text-blue-500 hover:bg-blue-50 rounded-full p-2 -ml-2 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:fill-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {commentCount > 0 && <span className="text-sm">{commentCount}</span>}
              </button>

              {/* Like Button */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors group"
              >
                <svg 
                  className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'group-hover:fill-red-500'}`} 
                  fill={isLiked ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                </svg>
                {likeCount > 0 && <span className="text-sm">{likeCount}</span>}
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 hover:text-green-500 hover:bg-green-50 rounded-full p-2 transition-colors group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-sm">แชร์</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {isLoading ? (
                  <p className="text-gray-500 text-sm">กำลังโหลดความคิดเห็น...</p>
                ) : (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-3">ความคิดเห็น ({commentCount})</h4>
                    <div className="space-y-3 mb-4">
                      {details?.comments?.map(comment => {
                        const canDeleteComment = user && (user.isAdmin || user.user_id === comment.user_id);
                        const isHighlightedComment = highlightedCommentId === comment.comment_id && isReported;
                        
                        return (
                          <div 
                            key={comment.comment_id} 
                            id={`comment-${comment.comment_id}`}
                            className={`p-3 rounded-lg ${
                              isHighlightedComment 
                                ? 'bg-red-100 border-2 border-red-500' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (comment.user_id) {
                                        navigate(`/users/${comment.user_id}`);
                                      }
                                    }}
                                    className="font-semibold text-sm text-gray-900 hover:underline"
                                  >
                                    {comment.user_fname}
                                  </button>
                                  <span className="text-xs text-gray-500">
                                    {formatDateTime(comment.comment_datetime)}
                                  </span>
                                  {isHighlightedComment && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                      ⚠️ ถูกรายงาน
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700 text-sm">{comment.comment_content || comment.comment_text}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {token && (
                                  <button
                                    onClick={(e) => handleReportComment(e, comment.comment_id)}
                                    className="text-xs text-gray-500 hover:text-red-500"
                                    title="รายงาน"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </button>
                                )}
                                {canDeleteComment && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteComment(comment.comment_id);
                                    }}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    ลบ
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(!details?.comments || details.comments.length === 0) && (
                        <p className="text-gray-500 text-sm">ยังไม่มีความคิดเห็น</p>
                      )}
                    </div>
                    
                    {/* Comment Form */}
                    {token ? (
                      <CommentForm postId={post.cpost_id} onCommentAdded={handleCommentAdded} />
                    ) : (
                      <p className="text-center text-gray-500 text-sm">
                        กรุณา <a href="/login" className="text-blue-500 hover:underline">เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportPostId(null);
          setReportCommentId(null);
        }}
        cpostId={reportPostId}
        commentId={reportCommentId}
        onReportSubmitted={() => {
          console.log('Report submitted successfully');
        }}
      />
    </article>
  );
}

// Comment Form Component
function CommentForm({ postId, onCommentAdded }) {
  const { token, user } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = user?.isAdmin || false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="แสดงความคิดเห็น..."
        required
      />
      <button 
        type="submit" 
        disabled={isSubmitting}
        className={`px-6 py-2 ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold rounded-full transition-colors disabled:opacity-50`}
      >
        {isSubmitting ? 'กำลังส่ง...' : 'ส่ง'}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </form>
  );
}

export default TwitterPostCard;

