import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';

function EditPostPage() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
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
        setContent(data.cpost_content || '');
        if (Array.isArray(data.cpost_images) && data.cpost_images.length > 0) {
          setExistingImages(data.cpost_images);
        } else if (data.cpost_image) {
          setExistingImages([data.cpost_image]);
        } else {
          setExistingImages([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, token, user, navigate]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    newPreviews.forEach(url => URL.revokeObjectURL(url));
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImages(files);
    setNewPreviews(previews);
  };

  useEffect(() => {
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  const handleRemoveExistingImage = (filename) => {
    setExistingImages(prev => prev.filter(img => img !== filename));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const buildAutoTitle = (text) => {
      if (!text) return 'โพสต์ใหม่';
      const trimmed = text.trim();
      if (!trimmed) return 'โพสต์ใหม่';
      const firstLine = trimmed.split('\n').find((line) => line.trim()) || trimmed;
      return firstLine.slice(0, 80);
    };

    const formData = new FormData();
    formData.append('cpost_title', buildAutoTitle(content));
    formData.append('cpost_content', content);
    formData.append('keep_images', JSON.stringify(existingImages));
    
    newImages.forEach(file => formData.append('cpost_images', file));

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
                  <label className="block mb-2 text-sm font-medium text-gray-900">รูปภาพปัจจุบัน</label>
                  {existingImages.length === 0 ? (
                    <p className="text-sm text-gray-500">ยังไม่มีรูปภาพในโพสต์นี้</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {existingImages.map((filename) => (
                        <div key={filename} className="relative rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={`http://localhost:3000/images/${filename}`}
                            alt="โพสต์"
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(filename)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full px-2 py-0.5 text-xs"
                          >
                            ลบ
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label htmlFor="image" className="block mb-2 text-sm font-medium text-gray-900">อัปโหลดรูปภาพใหม่ (เลือกได้หลายรูป)</label>
                  <input 
                    type="file" 
                    id="image"
                    name="cpost_images"
                    onChange={handleImageChange}
                    multiple
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {newPreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {newPreviews.map((src, idx) => (
                        <div key={src} className="relative rounded-xl overflow-hidden border border-gray-200">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-32 object-cover" />
                          <span className="absolute top-1 left-1 px-2 py-1 text-xs bg-black/60 text-white rounded-full">ใหม่ {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">ถ้าไม่เลือกไฟล์ใหม่ ระบบจะใช้รูปเดิมที่เหลือจากด้านบน</p>
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

