import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { API_URL, IMAGE_URL } from '../config/api';

function UserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileResp, postsResp, recipesResp] = await Promise.all([
          fetch(`${API_URL}/users/${userId}/public-profile`),
          fetch(`${API_URL}/users/${userId}/posts`),
          fetch(`${API_URL}/users/${userId}/recipes`)
        ]);

        if (profileResp.status === 404) {
          setError('ไม่พบผู้ใช้');
          setProfile(null);
          setPosts([]);
          setRecipes([]);
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
        const recipesData = recipesResp.ok ? await recipesResp.json() : [];

        setProfile(profileData);
        const enrichedPosts = (postsData || []).map(post => ({
          ...post,
          user_fname: profileData.user_fname,
          user_id: profileData.user_id
        }));
        setPosts(enrichedPosts);
        setRecipes(recipesData || []);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาด');
        setProfile(null);
        setPosts([]);
        setRecipes([]);
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
                {profile.user_image ? (
                  <img
                    src={profile.user_image.startsWith('http') ? profile.user_image : `${IMAGE_URL}/${profile.user_image}`}
                    alt={profile.user_fname}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-300 to-green-500 flex items-center justify-center text-white text-3xl font-bold uppercase">
                    {profile.user_fname?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {profile.full_name || profile.user_fname}
                  </h1>
                  <p className="text-gray-500">สมาชิกชุมชน MealVault</p>
                </div>
              </div>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">โพสต์ของ {profile.user_fname}</h2>
                {posts.length === 0 && recipes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                    ผู้ใช้นี้ยังไม่มีโพสต์
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* โพสต์ชุมชน */}
                    {posts.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">โพสต์ชุมชน</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {posts.map(post => (
                            <PostCard key={post.cpost_id} post={post} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* สูตรอาหาร */}
                    {recipes.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">สูตรอาหาร</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recipes.map(recipe => (
                            <Link
                              key={recipe.recipe_id}
                              to={`/menus/${recipe.recipe_id}`}
                              className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
                            >
                              <div className="relative">
                                <img
                                  src={recipe.recipe_image ? `${IMAGE_URL}/${recipe.recipe_image}` : '/images/no-image.png'}
                                  alt={recipe.recipe_title}
                                  className="w-full h-36 object-cover"
                                  onError={(e) => { e.currentTarget.src = '/images/no-image.png'; }}
                                />
                                <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-fuchsia-100 text-fuchsia-700">
                                  สูตรผู้ใช้
                                </span>
                              </div>
                              <div className="p-3 space-y-1">
                                <h3 className="font-semibold truncate text-gray-900">{recipe.recipe_title}</h3>
                                {recipe.recipe_category && (
                                  <p className="text-xs text-gray-500">หมวดหมู่: {recipe.recipe_category}</p>
                                )}
                                {recipe.recipe_description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">{recipe.recipe_description}</p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
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


