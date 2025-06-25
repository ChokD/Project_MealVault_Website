import React from 'react';
import { Link } from 'react-router-dom';

function PostSummaryCard({ post }) {
  // ตรวจสอบบรรทัดนี้: ต้องเป็น http://localhost:3000
  const imageUrl = post.cpost_image 
    ? `http://localhost:3000/images/${post.cpost_image}` 
     : 'http://localhost:3000/images/no-image.png'; // ใช้ภาพ placeholder ถ้าไม่มีรูป

  return (
    <Link to={`/posts/${post.cpost_id}`} className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">

      {/* เพิ่ม/แก้ไข img tag ให้ใช้ imageUrl */}
      <img className="w-full h-48 object-cover" src={imageUrl} alt={post.cpost_title} />

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{post.cpost_title}</h3>
        <p className="text-sm text-gray-500">โพสต์โดย: {post.user_fname}</p>
      </div>
    </Link>
  );
}

export default PostSummaryCard;