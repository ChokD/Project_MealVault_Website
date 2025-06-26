import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Hero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    // แยกคำค้นหาด้วย , หรือ เว้นวรรค และตัดช่องว่างที่ไม่จำเป็นออก
    const ingredients = query.split(/[, ]+/).filter(item => item.trim() !== '');

    if (ingredients.length === 0) {
      alert('กรุณากรอกวัตถุดิบที่ต้องการค้นหา');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/menus/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIngredients: ingredients }),
      });

      const results = await response.json();

      // ส่งผลลัพธ์ไปพร้อมกับการเปลี่ยนหน้า
      navigate('/search', { state: { results: results, query: query } });

    } catch (error) {
      console.error('Failed to search:', error);
      alert('เกิดข้อผิดพลาดในการค้นหา');
    }
  };

  return (
    <section className="text-center py-12 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        ค้นหาเมนูอาหารจากวัตถุดิบของคุณ
      </h2>
      {/* เปลี่ยนเป็น <form> */}
      <form onSubmit={handleSearch} className="mt-4 flex justify-center">
        <div className="w-full max-w-2xl flex items-center bg-white border border-gray-200 rounded-full shadow-lg p-2">
          <input 
            type="text" 
            placeholder="เช่น หมู, กะเพรา, พริก (คั่นด้วย , หรือเว้นวรรค)" 
            className="w-full px-4 py-2 text-gray-700 focus:outline-none rounded-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="bg-green-500 text-white font-bold rounded-full px-8 py-2 hover:bg-green-600 transition-colors duration-300">
            ค้นหา
          </button>
        </div>
      </form>
    </section>
  );
}

export default Hero;