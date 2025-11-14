import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:3000/api';

function ProfilePage() {
  const { token, user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'comments', 'likes'
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Data for tabs
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [likedMenus, setLikedMenus] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // ดึงข้อมูลผู้ใช้ปัจจุบันมาแสดงตอนเปิดหน้า
  useEffect(() => {
    if (user) {
      setLoading(false);
      loadTabData('posts');
    } else if (!token) {
      navigate('/login');
    }
  }, [user, token, navigate]);

  // Load data when tab changes
  useEffect(() => {
    if (user) {
      loadTabData(activeTab);
    }
  }, [activeTab, user]);

  const loadTabData = async (tab) => {
    if (!user?.user_id) return;
    setLoadingTab(true);
    try {
      if (tab === 'posts') {
        const resp = await fetch(`${API_URL}/users/${user.user_id}/posts`);
        const data = await resp.json();
        setPosts(data || []);
      } else if (tab === 'comments') {
        const resp = await fetch(`${API_URL}/users/${user.user_id}/comments`);
        const data = await resp.json();
        setComments(data || []);
      } else if (tab === 'likes') {
        const resp = await fetch(`${API_URL}/users/${user.user_id}/liked-menus`);
        const data = await resp.json();
        setLikedMenus(data || []);
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    } finally {
      setLoadingTab(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ไม่ควรเกิน 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('user_image', file);

      const response = await fetch(`${API_URL}/users/profile/image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }

      // Refresh user data เพื่อแสดงรูปภาพใหม่
      await refreshUser();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>กำลังโหลดข้อมูลผู้ใช้...</p>
        </main>
      </div>
    );
  }

  const fullName = user ? `${user.user_fname || ''} ${user.user_lname || ''}`.trim() || 'ไม่มีชื่อ' : 'ไม่มีชื่อ';

  // Debug: ตรวจสอบ user_image
  useEffect(() => {
    if (user) {
      console.log('User data:', user);
      console.log('User image:', user.user_image);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="relative group">
                {user?.user_image ? (
                  <img
                    src={`http://localhost:3000/images/${user.user_image}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-gray-300">
                    {user?.user_fname?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 rounded-full cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="text-white text-xs font-medium">กำลังอัปโหลด...</div>
                  ) : (
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </label>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{fullName}</h2>
                    {user?.user_tel && (
                      <p className="text-sm text-gray-500 mt-1">{user.user_tel}</p>
                    )}
                  </div>
                  <Link
                    to="/profile/edit"
                    className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-600 transition-colors"
                  >
                    แก้ไขข้อมูล
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                โพสต์
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                คอมเมนต์
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                  activeTab === 'likes'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ชื่นชอบ
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {loadingTab ? (
                <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
              ) : (
                <>
                  {activeTab === 'posts' && (
                    <div className="space-y-4">
                      {posts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">ยังไม่มีโพสต์</div>
                      ) : (
                        posts.map(post => (
                          <Link
                            key={post.cpost_id}
                            to={`/posts/${post.cpost_id}`}
                            className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex gap-4">
                              {post.cpost_image && (
                                <img
                                  src={post.cpost_image}
                                  alt=""
                                  className="w-24 h-24 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{post.cpost_title}</h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(post.cpost_datetime).toLocaleDateString('th-TH')}
                                </p>
                                <p className="text-sm text-gray-500">❤️ {post.like_count || 0}</p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">ยังไม่มีคอมเมนต์</div>
                      ) : (
                        comments.map(comment => (
                          <Link
                            key={comment.comment_id}
                            to={`/posts/${comment.cpost_id}`}
                            className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex gap-4">
                              {comment.post_image && (
                                <img
                                  src={comment.post_image}
                                  alt=""
                                  className="w-24 h-24 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{comment.post_title}</h3>
                                <p className="text-gray-700 mb-2">{comment.comment_text}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(comment.comment_datetime).toLocaleDateString('th-TH')}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'likes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {likedMenus.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">ยังไม่มีเมนูที่ชื่นชอบ</div>
                      ) : (
                        likedMenus.map(menu => (
                          <Link
                            key={menu.menu_id}
                            to={`/recipe/${menu.menu_id}`}
                            className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            {menu.menu_image && (
                              <img
                                src={menu.menu_image}
                                alt=""
                                className="w-full h-32 object-cover"
                              />
                            )}
                            <div className="p-3">
                              <h3 className="font-semibold mb-1 truncate">{menu.menu_name}</h3>
                              {menu.menu_description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{menu.menu_description}</p>
                              )}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
