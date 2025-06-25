import React from 'react';
import PostSummaryCard from './PostSummaryCard';

function PostList({ posts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map(post => (
        <PostSummaryCard key={post.cpost_id} post={post} />
      ))}
    </div>
  );
}

export default PostList;