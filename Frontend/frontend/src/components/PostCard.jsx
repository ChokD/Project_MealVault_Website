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
    <Link to={`/posts/${post.cpost_id}`} className="w-full h-full block group relative overflow-hidden rounded-xl">
      <img 
        src={imageUrl} 
        alt={post.cpost_title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <h3 className="font-bold text-lg">{post.cpost_title}</h3>
        <p className="text-sm opacity-80">โพสต์โดย: {post.user_fname}</p>
      </div>
    </Link>
  );
}

export default PostCard;
