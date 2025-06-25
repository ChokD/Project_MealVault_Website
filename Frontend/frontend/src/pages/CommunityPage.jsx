import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostList from '../components/PostList';
import { AuthContext } from '../context/AuthContext';

function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext); // ดึง token มาเช็คว่า login หรือยัง

  useEffect(() => {
    const fetchPosts = async () => {
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
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">ชุมชน MealVault</h1>
            {/* ถ้า Login แล้ว ให้แสดงปุ่มสร้างโพสต์ */}
            {token && (
              <Link to="/create-post" className="bg-green-500 text-white font-bold rounded-full px-6 py-2 hover:bg-green-600 transition-colors">
                สร้างโพสต์ใหม่
              </Link>
            )}
          </div>

          {loading ? (
            <p>กำลังโหลดโพสต์...</p>
          ) : (
            <PostList posts={posts} />
          )}
        </div>
      </main>
    </div>
  );
}

export default CommunityPage;