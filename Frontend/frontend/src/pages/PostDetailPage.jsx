import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';
import ConfirmationModal from '../components/ConfirmationModal';

// --- เราจะย้าย CommentForm ออกมาไว้ข้างนอกเพื่อความเป็นระเบียบ ---
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


function PostDetailPage() {
  const { postId } = useParams(); 
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}`);
      if (!response.ok) throw new Error('Post not found');
      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const confirmDelete = async () => {
    setIsModalOpen(false);
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'ไม่สามารถลบโพสต์ได้');
      }
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/community');
      }, 2000);
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };
  
  const handleCommentAdded = (newComment) => {
    setPost(prevPost => ({
      ...prevPost,
      comments: [...prevPost.comments, newComment],
    }));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center"><p>กำลังโหลดข้อมูลโพสต์...</p></main>
    </div>
  );
  
  if (!post) return (
     <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center"><h1 className="text-2xl font-bold">ไม่พบโพสต์ที่ต้องการ</h1></main>
    </div>
  );

  const canDelete = user && (user.isAdmin || user.user_id === post.user_id);

  const postImageUrl = post.cpost_image 
    ? `http://localhost:3000/images/${post.cpost_image}` 
    : 'https://via.placeholder.com/800x400.png?text=MealVault';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <article className="bg-white p-8 rounded-xl shadow-md">
            
            {showSuccess ? (
              <SuccessAnimation message="ลบโพสต์สำเร็จ!" />
            ) : (
              <>
                {canDelete && (
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-red-500 text-white font-bold text-sm rounded-full px-4 py-1 hover:bg-red-600 transition-colors"
                    >
                      ลบโพสต์นี้
                    </button>
                  </div>
                )}
                
                <img 
                  src={postImageUrl} 
                  alt={post.cpost_title} 
                  className="w-full h-auto max-h-96 object-cover rounded-lg mb-6 shadow-sm" 
                />
                
                <h1 className="text-3xl font-bold mb-4">{post.cpost_title}</h1>
                <p className="text-sm text-gray-500 mb-6">โพสต์โดย: {post.user_fname} เมื่อ {new Date(post.cpost_datetime).toLocaleDateString('th-TH')}</p>
                <div className="prose max-w-none">
                  {post.cpost_content}
                </div>
              </>
            )}

          </article>

          {!showSuccess && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">ความคิดเห็น ({post.comments.length})</h2>
              <div className="space-y-6">
                {post.comments.map(comment => (
                  <div key={comment.comment_id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <p className="font-semibold text-gray-800">{comment.user_fname}</p>
                      <p className="text-xs text-gray-400 ml-4">{new Date(comment.comment_datetime).toLocaleString('th-TH')}</p>
                    </div>
                    <p className="text-gray-700">{comment.comment_content}</p>
                  </div>
                ))}
                {post.comments.length === 0 && <p className="text-gray-500">ยังไม่มีความคิดเห็น</p>}
              </div>

              {token ? (
                  <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
              ) : (
                  <p className="mt-8 text-center text-gray-500">กรุณา <a href="/login" className="text-green-600 font-bold hover:underline">เข้าสู่ระบบ</a> เพื่อแสดงความคิดเห็น</p>
              )}
            </section>
          )}

        </div>
      </main>
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?"
      />
    </div>
  );
}

export default PostDetailPage;