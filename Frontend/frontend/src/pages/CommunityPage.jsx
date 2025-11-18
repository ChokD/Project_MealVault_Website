import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AccordionItem from '../components/AccordionItem';
import { AuthContext } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessAnimation from '../components/SuccessAnimation';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useContext(AuthContext);
  const [openPostId, setOpenPostId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ id: null, type: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // ตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = user?.isAdmin || false;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ตรวจสอบ query parameters สำหรับ highlight
  useEffect(() => {
    const postId = searchParams.get('post');
    const reported = searchParams.get('reported');
    const commentId = searchParams.get('comment');

    console.log('CommunityPage - Query params:', { postId, reported, commentId });
    console.log('CommunityPage - Posts loaded:', posts.length);
    console.log('CommunityPage - Current openPostId:', openPostId);

    if (postId) {
      if (posts.length > 0) {
        // ตรวจสอบว่าโพสต์มีอยู่ในรายการหรือไม่
        const postExists = posts.some(p => p.cpost_id === postId);
        console.log('CommunityPage - Post exists:', postExists);
        
        if (postExists) {
          console.log('CommunityPage - Opening post:', postId);
          // เปิดโพสต์ที่ระบุ
          setOpenPostId(postId);
          
          // Scroll ไปที่โพสต์หลังจากโหลดเสร็จและเปิด accordion
          const scrollTimeout = setTimeout(() => {
            const element = document.getElementById(`post-${postId}`);
            console.log('CommunityPage - Scroll to element:', element);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // ถ้ามี comment ให้ scroll ไปที่ comment ด้วย
              if (commentId) {
                setTimeout(() => {
                  const commentElement = document.getElementById(`comment-${commentId}`);
                  if (commentElement) {
                    commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 1500);
              }
            } else {
              console.error('CommunityPage - Element not found:', `post-${postId}`);
            }
          }, 1200);
          
          return () => clearTimeout(scrollTimeout);
        } else {
          console.error('CommunityPage - Post not found in list:', postId);
        }
      } else {
        console.log('CommunityPage - Post ID found but posts not loaded yet, will retry');
      }
    }
  }, [searchParams, posts, openPostId]);

  const handleToggle = (postId) => {
    setOpenPostId(openPostId === postId ? null : postId);
  };

  const handleDeletePostClick = (postId) => {
    setItemToDelete({ id: postId, type: 'post' });
    setIsModalOpen(true);
  };
  
  // 1. สร้างฟังก์ชันสำหรับจัดการเมื่อกดลบคอมเมนต์
  const handleDeleteCommentClick = (commentId) => {
    setItemToDelete({ id: commentId, type: 'comment' });
    setIsModalOpen(true);
  }

  // 2. แก้ไขฟังก์ชัน confirmDelete ให้รองรับทั้งการลบโพสต์และคอมเมนต์
  const confirmDelete = async () => {
    setIsModalOpen(false);
    const { id, type } = itemToDelete;
    
    // ใช้ route ใหม่สำหรับลบคอมเมนต์ (รองรับทั้งเจ้าของและ Admin)
    const url = type === 'post' 
      ? `http://localhost:3000/api/posts/${id}`
      : `http://localhost:3000/api/posts/comments/${id}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `ไม่สามารถลบ${type === 'post' ? 'โพสต์' : 'คอมเมนต์'}ได้`);
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        fetchPosts(); // โหลดรายการโพสต์ใหม่ทั้งหมดเพื่ออัปเดต
      }, 2000);
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${isAdmin ? 'text-red-600' : 'text-gray-800'}`}>
              ชุมชน MealVault {isAdmin && <span className="text-sm text-red-500">[Admin Mode]</span>}
            </h1>
            {token && (
              <div className="flex gap-3 flex-wrap justify-end">
                <Link 
                  to="/create-post" 
                  className={`${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-bold rounded-full px-6 py-2 transition-colors`}
                >
                  สร้างโพสต์ใหม่
                </Link>
              </div>
            )}
          </div>
          
          {loading ? (
            <p>กำลังโหลดโพสต์...</p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => {
                const highlightedPostId = searchParams.get('post');
                const isReported = searchParams.get('reported') === 'true';
                const highlightedCommentId = searchParams.get('comment');
                
                // Highlight ถ้ามี post parameter และ reported=true
                const isHighlighted = highlightedPostId === post.cpost_id && isReported;
                const shouldOpen = highlightedPostId === post.cpost_id;
                
                // Debug log
                if (shouldOpen) {
                  console.log('CommunityPage - Post matches:', {
                    postId: post.cpost_id,
                    highlightedPostId,
                    isReported,
                    isHighlighted,
                    shouldOpen,
                    highlightedCommentId,
                    openPostId
                  });
                }
                
                return (
                  <div 
                    key={post.cpost_id}
                    id={`post-${post.cpost_id}`}
                    className={isHighlighted ? 'ring-4 ring-red-500 ring-opacity-75 rounded-xl p-2 -m-2 bg-red-50 transition-all duration-500' : ''}
                    style={isHighlighted ? { 
                      animation: 'pulse 2s ease-in-out 3',
                      border: '4px solid #ef4444'
                    } : {}}
                  >
                    {isHighlighted && (
                      <div className="mb-3 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg inline-block shadow-lg">
                        ⚠️ โพสต์นี้ถูกรายงาน
                      </div>
                    )}
                    <AccordionItem 
                      post={post}
                      isOpen={openPostId === post.cpost_id}
                      onToggle={() => handleToggle(post.cpost_id)}
                      onDeleteClick={handleDeletePostClick} 
                      onDeleteComment={handleDeleteCommentClick}
                      highlightedCommentId={highlightedCommentId && shouldOpen ? highlightedCommentId : null}
                      isReported={isHighlighted}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title={`คุณแน่ใจหรือไม่ว่าต้องการลบ${itemToDelete.type === 'post' ? 'โพสต์' : 'ความคิดเห็น'}นี้?`}
      />
      
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <SuccessAnimation message={`ลบ${itemToDelete.type === 'post' ? 'โพสต์' : 'ความคิดเห็น'}สำเร็จ!`}/>
            </div>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;