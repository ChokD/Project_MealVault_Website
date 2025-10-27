import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// Component สำหรับการ์ดเมนูแต่ละอัน
function RecipeCard({ recipe }) {
    if (!recipe) return null;
    return (
        <Link to={`/menus/${recipe.idMeal}`} className="w-full h-full block group relative overflow-hidden rounded-xl shadow-lg">
            <img 
                src={recipe.strMealThumb} 
                alt={recipe.strMeal} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4 text-white">
                <h3 className="font-bold text-lg mb-1">{recipe.strMeal}</h3>
                <p className="text-sm opacity-90 bg-green-500 px-3 py-1 rounded-full inline-block">{recipe.strCategory}</p>
            </div>
        </Link>
    );
}

function Recommended() {
  const [recommendedMenus, setRecommendedMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    const fetchRecommendedMenus = async () => {
      setLoading(true);
      try {
        const fetchPromises = Array.from({ length: 6 }, () => 
          fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(res => res.json())
        );
        const results = await Promise.all(fetchPromises);
        const menus = results.map(result => result.meals[0]).filter(Boolean);
        setRecommendedMenus(menus);
      } catch (error) {
        console.error("Failed to fetch recommended menus:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendedMenus();
  }, []);

  useEffect(() => {
    if (recommendedMenus.length > ITEMS_PER_PAGE) {
      const timer = setTimeout(() => {
        paginate(1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [page, recommendedMenus]);

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
  };
  
  const totalPages = Math.ceil(recommendedMenus.length / ITEMS_PER_PAGE);

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
        <h2 className="text-3xl font-bold mb-8 text-center md:text-left">เมนูแนะนำ</h2>
        <div className="relative w-full h-64 flex items-center justify-center bg-gray-100 rounded-xl"><p>กำลังโหลดเมนูแนะนำ...</p></div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-10 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            เมนูแนะนำ
          </h2>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => paginate(-1)} className="bg-white text-green-600 p-3 rounded-full shadow-lg hover:bg-green-50 hover:shadow-xl transition-all transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => paginate(1)} className="bg-white text-green-600 p-3 rounded-full shadow-lg hover:bg-green-50 hover:shadow-xl transition-all transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      
      <div className="relative w-full mx-auto h-64 overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-green-50 to-white">
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
            {recommendedMenus.slice(page * ITEMS_PER_PAGE, (page * ITEMS_PER_PAGE) + ITEMS_PER_PAGE).map(recipe => (
                <RecipeCard key={recipe.idMeal} recipe={recipe} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default Recommended;