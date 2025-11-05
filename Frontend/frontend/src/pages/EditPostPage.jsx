import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';

function EditPostPage() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.isAdmin || false;

  // ดึงข้อมูลโพสต์
  useEffect(() => {
    const fetchPost = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      // รอให้ user โหลดเสร็จก่อน
      if (!user) {
        return; // รอให้ user โหลดเสร็จ
      }

      try {
        const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('ไม่พบโพสต์');
        }

        const data = await response.json();
        
        // ตรวจสอบสิทธิ์หลังจากได้ข้อมูลโพสต์แล้ว
        if (!user.isAdmin && user.user_id !== data.user_id) {
          alert('คุณไม่มีสิทธิ์แก้ไขโพสต์นี้');
          navigate('/community');
          return;
        }
        
        // ถ้ามีสิทธิ์ ให้โหลดข้อมูล
        setTitle(data.cpost_title || '');
        setContent(data.cpost_content || '');
        setCurrentImage(data.cpost_image);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, token, user, navigate]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('cpost_title', title);
    formData.append('cpost_content', content);
    
    if (image) {
      formData.append('cpost_image', image);
    }

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/community');
      }, 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4 pt-24">
          <p>กำลังโหลดข้อมูล...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-2xl p-8 space-y-6">
          {showSuccess ? (
            <SuccessAnimation message="แก้ไขโพสต์สำเร็จ!" />
          ) : (
            <>
              <h1 className={`text-2xl font-bold text-center ${isAdmin ? 'text-red-600' : 'text-gray-800'}`}>
                แก้ไขโพสต์
              </h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">หัวข้อโพสต์</label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block mb-2 text-sm font-medium text-gray-900">เนื้อหา</label>
                  <textarea
                    id="content"
                    rows="6"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
                    required
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="image" className="block mb-2 text-sm font-medium text-gray-900">รูปภาพประกอบ (ไม่บังคับ)</label>
                  {currentImage && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">รูปภาพปัจจุบัน:</p>
                      <img 
                        src={`http://localhost:3000/images/${currentImage}`}
                        alt="Current"
                        className="w-full max-w-md h-auto rounded-lg"
                      />
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="image"
                    name="cpost_image"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">เลือกไฟล์ใหม่เพื่อเปลี่ยนรูปภาพ (ถ้าไม่เลือกจะใช้รูปเดิม)</p>
                </div>

                {error && <p className="text-center text-red-500">{error}</p>}
                <button 
                  type="submit" 
                  className={`w-full ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white font-medium rounded-full text-sm px-5 py-2.5 text-center transition-colors`}
                >
                  บันทึกการแก้ไข
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default EditPostPage;

