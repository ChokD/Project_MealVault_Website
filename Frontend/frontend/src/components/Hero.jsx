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
    <section className="text-center py-12 md:py-16 relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Icon and Title */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
        >
          ค้นหาเมนูอาหาร
        </motion.h2>
        
        <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
          ลองพิมพ์วัตถุดิบหลักที่คุณมี (เช่น chicken, salmon, pork)
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mt-6 flex justify-center">
          <div className="w-full max-w-3xl flex items-center bg-white border-2 border-green-100 rounded-full shadow-xl p-2 transform transition-all duration-300 hover:shadow-2xl hover:border-green-300">
            <div className="flex items-center px-4 text-green-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="ค้นหาด้วยวัตถุดิบหลัก 1 อย่าง (ภาษาอังกฤษ)" 
              className="w-full px-4 py-3 text-gray-700 focus:outline-none text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full px-8 py-3 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ค้นหา
            </button>
          </div>
        </form>
        
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 inline-block bg-red-50 border-2 border-red-200 text-red-700 font-semibold px-6 py-3 rounded-full shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Suggestions */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <span className="text-gray-600 font-semibold">ตัวอย่าง:</span>
          {['chicken', 'salmon', 'pork', 'beef', 'vegetable'].map((tag) => (
            <motion.button
              key={tag}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuery(tag)}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-300 text-sm font-medium"
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
