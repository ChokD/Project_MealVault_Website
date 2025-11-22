import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function PostCard({ post }) {
  if (!post) return null;

  const primaryImage = (post.cpost_images && post.cpost_images.length > 0)
    ? post.cpost_images[0]
    : post.cpost_image;

  const hasImage = !!primaryImage;
  const imageUrl = primaryImage
    ? (primaryImage.startsWith('http') ? primaryImage : `http://localhost:3000/images/${primaryImage}`)
    : null;

  const navigate = useNavigate();
  const isRecipe = post.post_type === 'recipe';
  const recipeInfo = post.recipe || null;
  const createdAt = post.cpost_datetime ? new Date(post.cpost_datetime) : null;
  const formattedCreatedAt = createdAt
    ? createdAt.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const handleAuthorClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (post.user_id) {
      navigate(`/users/${post.user_id}`);
    }
  };

  // แสดงผลแบบต่างกันสำหรับโพสต์ที่มีรูปและไม่มีรูป
  if (!hasImage) {
    return (
      <Link to={`/community?post=${post.cpost_id}`} className="block group">
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {post.user_fname?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={handleAuthorClick}
                className="text-sm font-semibold text-gray-800 hover:text-emerald-600 focus:outline-none"
              >
                {post.user_fname}
              </button>
              {formattedCreatedAt && (
                <p className="text-xs text-gray-500">{formattedCreatedAt}</p>
              )}
            </div>
            {isRecipe && (
              <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                สูตรอาหาร
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
            {post.cpost_title}
          </h3>
          {post.cpost_content && (
            <p className="text-gray-600 text-sm line-clamp-3">{post.cpost_content}</p>
          )}
          {isRecipe && recipeInfo?.recipe_category && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span>หมวดหมู่: {recipeInfo.recipe_category}</span>
              {recipeInfo?.total_time_minutes && (
                <span>• เวลา: {recipeInfo.total_time_minutes} นาที</span>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    // ทำให้การ์ดทั้งใบเป็นลิงก์ไปยังหน้ารายละเอียดของโพสต์
    <Link to={`/community?post=${post.cpost_id}`} className="w-full h-full block group relative overflow-hidden rounded-xl shadow-lg">
      <img 
        src={imageUrl} 
        alt={post.cpost_title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
      {isRecipe && (
        <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
          สูตรอาหาร
        </div>
      )}
      <div className="absolute bottom-0 left-0 p-4 text-white">
        <h3 className="font-bold text-lg mb-1">{post.cpost_title}</h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleAuthorClick}
            className="text-sm opacity-90 bg-emerald-500 px-3 py-1 rounded-full inline-block hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors"
          >
            โพสต์โดย: {post.user_fname}
          </button>
          {isRecipe && recipeInfo?.recipe_category && (
            <div className="text-xs bg-white/20 inline-block px-2 py-1 rounded-full">
              หมวดหมู่: {recipeInfo.recipe_category}
            </div>
          )}
          {formattedCreatedAt && (
            <p className="text-xs text-white/80">
              โพสต์เมื่อ: {formattedCreatedAt}
            </p>
          )}
          {isRecipe && recipeInfo?.total_time_minutes && (
            <p className="text-xs text-white/80">
              ใช้เวลารวม: {recipeInfo.total_time_minutes} นาที
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
