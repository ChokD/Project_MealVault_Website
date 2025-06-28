import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard'; // นำเข้าการ์ดที่เราเพิ่งสร้าง

function UserPosts() {
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const fetchLatestPosts = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลโพสต์จาก API ของเราเอง
        const response = await fetch('http://localhost:3000/api/posts');
        const data = await response.json();
        // นำมาแค่ 6 โพสต์ล่าสุดเพื่อทำสไลด์โชว์ 2 หน้า
        setLatestPosts(data.slice(0, 6)); 
      } catch (error) {
        console.error("Failed to fetch latest posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestPosts();
  }, []);

  // ส่วนของ Auto-slide และ Animation
  useEffect(() => {
    if (latestPosts.length > ITEMS_PER_PAGE) {
      const timer = setTimeout(() => {
        paginate(1);
      }, 5500); // ตั้งเวลาให้ต่างกันเล็กน้อย
      return () => clearTimeout(timer);
    }
  }, [page, latestPosts]);

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
  };
  
  const totalPages = Math.ceil(latestPosts.length / ITEMS_PER_PAGE);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setPage((prevPage) => {
        let nextPage = prevPage + newDirection;
        if (nextPage < 0) return totalPages - 1;
        if (nextPage >= totalPages) return 0;
        return nextPage;
    });
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-3xl font-bold mb-8">หมวดหมู่อาหาร</h2>
        <div className="relative w-full h-64 flex items-center justify-center bg-gray-100 rounded-xl"><p>กำลังโหลดโพสต์ล่าสุด...</p></div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">หมวดหมู่อาหาร</h2>
        <div className="flex space-x-2">
           <button onClick={() => paginate(-1)} className="bg-white text-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => paginate(1)} className="bg-white text-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      
      <div className="relative w-full mx-auto h-64 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            className="absolute w-full h-full grid grid-cols-1 md:grid-cols-3 gap-8"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {latestPosts.slice(page * ITEMS_PER_PAGE, (page * ITEMS_PER_PAGE) + ITEMS_PER_PAGE).map(post => (
                <PostCard key={post.cpost_id} post={post} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default UserPosts;