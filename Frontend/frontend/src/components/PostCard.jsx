import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function PostCard({ post }) {
  if (!post) return null;

  const primaryImage = (post.cpost_images && post.cpost_images.length > 0)
    ? post.cpost_images[0]
    : post.cpost_image;

  const imageUrl = primaryImage
    ? (primaryImage.startsWith('http') ? primaryImage : `http://localhost:3000/images/${primaryImage}`)
    : '/placeholder.svg';

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

  return (
    // ทำให้การ์ดทั้งใบเป็นลิงก์ไปยังหน้ารายละเอียดของโพสต์
    <Link to={`/posts/${post.cpost_id}`} className="w-full h-full block group relative overflow-hidden rounded-xl shadow-lg">
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
