import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileResp, postsResp] = await Promise.all([
          fetch(`http://localhost:3000/api/users/${userId}/public-profile`),
          fetch(`http://localhost:3000/api/users/${userId}/posts`)
        ]);

        if (profileResp.status === 404) {
          setError('ไม่พบผู้ใช้');
          setProfile(null);
          setPosts([]);
          return;
        }

        if (!profileResp.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
        }

        if (!postsResp.ok) {
          throw new Error('ไม่สามารถดึงโพสต์ของผู้ใช้ได้');
        }

        const profileData = await profileResp.json();
        const postsData = await postsResp.json();

        setProfile(profileData);
        const enrichedPosts = (postsData || []).map(post => ({
          ...post,
          user_fname: profileData.user_fname,
          user_id: profileData.user_id
        }));
        setPosts(enrichedPosts);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาด');
        setProfile(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-10 max-w-5xl">
          {loading ? (
            <div className="text-center py-16 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="text-center py-16 text-red-600 font-semibold">{error}</div>
          ) : profile ? (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-300 to-green-500 flex items-center justify-center text-white text-3xl font-bold uppercase">
                  {profile.user_fname?.charAt(0) || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {profile.full_name || profile.user_fname}
                  </h1>
                  <p className="text-gray-500">สมาชิกชุมชน MealVault</p>
                </div>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">โพสต์ของ {profile.user_fname}</h2>
                {posts.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                    ผู้ใช้นี้ยังไม่มีโพสต์
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map(post => (
                      <PostCard key={post.cpost_id} post={post} />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="text-center py-16 text-gray-500">ไม่พบข้อมูลผู้ใช้</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default UserProfilePage;


