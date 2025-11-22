import React from 'react';
import { Link } from 'react-router-dom';

function PostCard({ post }) {
  if (!post) return null;

  // สร้าง URL รูปภาพไปยัง Backend ของเรา
  const imageUrl = post.cpost_image 
    ? `http://localhost:3000/images/${post.cpost_image}`
    : 'https://via.placeholder.com/400x300.png?text=MealVault';

  return (
    // ทำให้การ์ดทั้งใบเป็นลิงก์ไปยังหน้ารายละเอียดของโพสต์
    <Link to={`/posts/${post.cpost_id}`} className="w-full h-full block group relative overflow-hidden rounded-xl shadow-lg">
      <img 
        src={imageUrl} 
        alt={post.cpost_title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <h3 className="font-bold text-lg mb-1">{post.cpost_title}</h3>
        <p className="text-sm opacity-90 bg-emerald-500 px-3 py-1 rounded-full inline-block">โพสต์โดย: {post.user_fname}</p>
      </div>
    </Link>
  );
}

export default PostCard;
