import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';

function CreatePostPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [warning, setWarning] = useState(null);

  const isAdmin = user?.isAdmin || false;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    previews.forEach(url => URL.revokeObjectURL(url));
    const nextPreviews = files.map(file => URL.createObjectURL(file));
    setImages(files);
    setPreviews(nextPreviews);
  };

  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

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

    // --- ส่วนที่แก้ไขให้ถูกต้อง ---
    const formData = new FormData();
    formData.append('cpost_title', buildAutoTitle(content));
    formData.append('cpost_content', content);
    
    // เพิ่มเงื่อนไข: จะเพิ่มรูปภาพเข้าไปก็ต่อเมื่อผู้ใช้เลือกไฟล์แล้วเท่านั้น
    images.forEach(file => formData.append('cpost_images', file));

    try {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          // ไม่ต้องใส่ 'Content-Type' ตอนส่ง FormData
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        // Check if it's a moderation error
        if (data.moderation) {
          throw new Error(data.message || 'เนื้อหาไม่เหมาะสม');
        }
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }

      // Show warning if content was flagged but allowed
      if (data.warning) {
        setWarning(data.warning);
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/community');
      }, 2000);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-2xl p-8 space-y-6">
          {showSuccess ? (
            <SuccessAnimation message="สร้างโพสต์สำเร็จ!" />
          ) : (
            <>
              <h1 className={`text-2xl font-bold text-center ${isAdmin ? 'text-red-600' : 'text-gray-800'}`}>
                สร้างโพสต์ใหม่
              </h1>
              
              {warning && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-yellow-800">{warning.message}</h4>
                      <p className="text-sm text-yellow-600 mt-1">โพสต์ของคุณถูกสร้างแล้ว แต่อาจมีเนื้อหาที่ต้องระวัง</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- โค้ดที่ถูกต้องสำหรับฟอร์ม --- */}
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
                  <label htmlFor="image" className="block mb-2 text-sm font-medium text-gray-900">รูปภาพประกอบ (อัปโหลดได้หลายรูป)</label>
                  <input 
                    type="file" 
                    id="image"
                    name="cpost_images"
                    onChange={handleImageChange}
                    multiple
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {previews.map((src, idx) => (
                        <div key={src} className="relative rounded-xl overflow-hidden border border-gray-200">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-32 object-cover" />
                          <span className="absolute top-1 left-1 px-2 py-1 text-xs bg-black/60 text-white rounded-full">รูป {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* ----------------------------- */}

                {error && <p className="text-center text-red-500">{error}</p>}
                <button 
                  type="submit" 
                  className={`w-full text-white ${isAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} font-medium rounded-full text-sm px-5 py-2.5 text-center transition-colors`}
                >
                  เผยแพร่โพสต์
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default CreatePostPage;