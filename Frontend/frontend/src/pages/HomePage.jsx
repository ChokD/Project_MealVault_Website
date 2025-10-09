import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Recommended from '../components/Recommended';
import UserPosts from '../components/UserPosts';

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24">
        {/* แก้ไขที่บรรทัดนี้ */}
        <div className="container mx-auto px-6 sm:px-8"> 
          <Hero />
          <Recommended /> 
          <UserPosts />
        </div>
      </main>
    </div>
  );
}

export default HomePage;