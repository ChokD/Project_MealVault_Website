import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AccordionItem from '../components/AccordionItem';
import { AuthContext } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import SuccessAnimation from '../components/SuccessAnimation';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);
  const [openPostId, setOpenPostId] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ id: null, type: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

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
    const url = type === 'post' 
      ? `http://localhost:3000/api/posts/${id}`
      : `http://localhost:3000/api/admin/comments/${id}`;
    
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
            <h1 className="text-3xl font-bold">ชุมชน MealVault</h1>
            {token && (
              <Link to="/create-post" className="bg-green-500 text-white font-bold rounded-full px-6 py-2 hover:bg-green-600 transition-colors">
                สร้างโพสต์ใหม่
              </Link>
            )}
          </div>
          
          {loading ? (
            <p>กำลังโหลดโพสต์...</p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <AccordionItem 
                  key={post.cpost_id}
                  post={post}
                  isOpen={openPostId === post.cpost_id}
                  onToggle={() => handleToggle(post.cpost_id)}
                  onDeleteClick={handleDeletePostClick} 
                  onDeleteComment={handleDeleteCommentClick} // 3. ส่งฟังก์ชันลบคอมเมนต์ไปให้ลูก
                />
              ))}
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