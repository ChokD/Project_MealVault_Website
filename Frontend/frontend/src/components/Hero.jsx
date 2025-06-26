import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // 1. นำเข้าเครื่องมือทำ Animation

function Hero() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // 2. เพิ่ม State สำหรับจัดการ Error Message
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(''); // เคลียร์ Error เก่าทุกครั้งที่กด
    
    const ingredients = query.split(/[, ]+/).filter(item => item.trim() !== '');

    // --- 3. ส่วนจัดการ Error Animation ---
    if (ingredients.length === 0) {
      setError('กรุณากรอกวัตถุดิบอย่างน้อย 1 อย่าง');
      // ตั้งเวลา 3 วินาทีให้ Error หายไปเอง
      setTimeout(() => setError(''), 3000); 
      return;
    }
    // ------------------------------------

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/menus/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIngredients: ingredients }),
      });

      const results = await response.json();
      
      // ตอนนี้เราจะส่งผลลัพธ์ไปพร้อมกับการเปลี่ยนหน้า
      navigate('/search', { state: { results: results, query: query } });

    } catch (err) {
      console.error('Failed to search:', err);
      setError('เกิดข้อผิดพลาดในการค้นหา');
      setTimeout(() => setError(''), 3000);
    } finally {
      // ไม่ต้อง setLoading(false) ที่นี่ เพราะหน้าจะเปลี่ยนไปก่อน
    }
  };

  return (
    <section className="text-center py-12 md:py-20 relative">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        ค้นหาเมนูอาหารจากวัตถุดิบของคุณ
      </h2>
      <form onSubmit={handleSearch} className="mt-4 flex justify-center">
        <div className="w-full max-w-2xl flex items-center bg-white border border-gray-200 rounded-full shadow-lg p-2">
          <input 
            type="text" 
            placeholder="เช่น หมู, กะเพรา, พริก (คั่นด้วย , หรือเว้นวรรค)" 
            className="w-full px-4 py-2 text-gray-700 focus:outline-none rounded-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-green-500 text-white font-bold rounded-full px-8 py-2 hover:bg-green-600 transition-colors duration-300 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
        </div>
      </form>
      
      {/* --- 4. ส่วนแสดง Animation Error --- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="mt-4 inline-block bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ---------------------------------- */}
    </section>
  );
}

export default Hero;