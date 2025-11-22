import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TwitterPostCard from '../components/TwitterPostCard';
import { AuthContext } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessAnimation from '../components/SuccessAnimation';
import { API_URL, IMAGE_URL } from '../config/api';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ id: null, type: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = user?.isAdmin || false;

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts`);
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

  // ตรวจสอบ query parameters สำหรับ highlight และ scroll
  useEffect(() => {
    const postId = searchParams.get('post');
    const reported = searchParams.get('reported');
    const commentId = searchParams.get('comment');

    if (postId && posts.length > 0) {
      const postExists = posts.some(p => p.cpost_id === postId);
      
      if (postExists) {
        // Scroll ไปที่โพสต์ (ปรับ offset เพื่อไม่ให้ถูก navbar ทับ)
        const scrollTimeout = setTimeout(() => {
          const element = document.getElementById(`post-${postId}`);
          if (element) {
            const navbar = document.querySelector('nav');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            const y = element.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 500);

        return () => clearTimeout(scrollTimeout);
      }
    }
  }, [searchParams, posts]);

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
      ? `${API_URL}/posts/${id}`
      : `${API_URL}/posts/comments/${id}`;
    
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <div className="max-w-6xl mx-auto flex">
          {/* Left Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0 border-r border-gray-200 px-4 py-4">
            <div className="sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-6 px-4">ชุมชน</h2>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    // If there are posts available, target the latest (first) post id
                    const latestId = (posts && posts.length > 0) ? posts[0].cpost_id : null;

                    if (location.pathname !== '/community') {
                      // Navigate to community and include post query so the effect will scroll after load
                      if (latestId) {
                        navigate(`/community?post=${latestId}`, { preventScrollReset: true });
                      } else {
                        navigate('/community', { preventScrollReset: true });
                      }
                      return;
                    }

                    // If already on the community page, just scroll to the latest post (or top)
                    if (latestId) {
                      const el = document.getElementById(`post-${latestId}`);
                      if (el) {
                        const navbar = document.querySelector('nav');
                        const navbarHeight = navbar ? navbar.offsetHeight : 80;
                        const y = el.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                        return;
                      }
                    }
                    // Fallback: scroll to top of feed (account for navbar)
                    const feed = document.querySelector('.border-x');
                    const navbar = document.querySelector('nav');
                    const navbarHeight = navbar ? navbar.offsetHeight : 80;
                    if (feed) {
                      const y = feed.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: Math.max(0, window.scrollY - navbarHeight - 8), behavior: 'smooth' });
                    }
                  }}
                  className="block text-left w-full px-4 py-3 rounded-full hover:bg-gray-100 transition-colors font-semibold text-gray-900 text-[15px]"
                >
                  หน้าแรก
                </button>
                {token && (
                  <Link 
                    to="/create-post" 
                    className={`block px-4 py-3 rounded-full ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-colors text-center text-[15px]`}
                  >
                    สร้างโพสต์ใหม่
                  </Link>
                )}
              </nav>
            </div>
          </aside>

          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            {/* Mobile Header */}
            <div className="md:hidden sticky top-20 z-10 bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">ชุมชน</h1>
                {token && (
                  <Link 
                    to="/create-post" 
                    className={`${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold rounded-full px-4 py-2 text-sm transition-colors`}
                  >
                    สร้างโพสต์
                  </Link>
                )}
              </div>
            </div>

            {/* Feed Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">กำลังโหลดโพสต์...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">ยังไม่มีโพสต์</p>
              </div>
            ) : (
              <div className="border-x border-gray-200">
                {posts.map(post => {
                  const highlightedPostId = searchParams.get('post');
                  const isReported = searchParams.get('reported') === 'true' && highlightedPostId === post.cpost_id;
                  const highlightedCommentId = searchParams.get('comment');
                  
                  return (
                    <TwitterPostCard
                      key={post.cpost_id}
                      post={post}
                      onDeleteClick={handleDeletePostClick}
                      onDeleteComment={handleDeleteCommentClick}
                      highlightedCommentId={highlightedCommentId && highlightedPostId === post.cpost_id ? highlightedCommentId : null}
                      isReported={isReported}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar (Optional - can be used for suggestions, trending, etc.) */}
          <aside className="hidden lg:block w-80 flex-shrink-0 px-6 py-4">
            <div className="sticky top-20">
              {/* Placeholder for future features */}
            </div>
          </aside>
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
