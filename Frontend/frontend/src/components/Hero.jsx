import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Hero() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const mainIngredient = query.trim().split(/[, ]+/)[0];

    if (!mainIngredient) {
      setError('กรุณากรอกวัตถุดิบ (ภาษาอังกฤษ)');
      setTimeout(() => setError(''), 3000); 
      return;
    }
    
    navigate(`/search?q=${mainIngredient}`);
  };

  return (
    <section className="text-center py-8 md:py-12 relative">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        ค้นหาเมนูอาหาร
      </h2>
      <p className="text-gray-500 mb-6">ลองพิมพ์วัตถุดิบหลักที่คุณมี (เช่น chicken, salmon, pork)</p>
      <form onSubmit={handleSearch} className="mt-4 flex justify-center">
        <div className="w-full max-w-2xl flex items-center bg-white border border-gray-200 rounded-full shadow-lg p-2">
          <input 
            type="text" 
            placeholder="ค้นหาด้วยวัตถุดิบหลัก 1 อย่าง (ภาษาอังกฤษ)" 
            className="w-full px-4 py-2 text-gray-700 focus:outline-none rounded-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-green-500 text-white font-bold rounded-full px-8 py-2 hover:bg-green-600 transition-colors duration-300"
          >
            ค้นหา
          </button>
        </div>
      </form>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 inline-block bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Hero;
