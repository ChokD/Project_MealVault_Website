import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RecipeCard from '../components/RecipeCard';

// 1. กำหนดหมวดหมู่ที่เราสนใจให้มากขึ้น
const CATEGORIES = ['Seafood', 'Chicken', 'Dessert', 'Pasta', 'Vegetarian', 'Beef'];

function MenuPage() {
  const [allRecipes, setAllRecipes] = useState({}); // State สำหรับเก็บเมนูทั้งหมด โดยแยกตามหมวดหมู่
  const [activeCategory, setActiveCategory] = useState('All'); // State สำหรับหมวดหมู่ที่ถูกเลือก
  const [searchTerm, setSearchTerm] = useState(''); // State สำหรับคำค้นหา
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllRecipes = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลจากทุกหมวดหมู่ที่เรากำหนดไว้พร้อมกัน
        const fetchPromises = CATEGORIES.map(category =>
          fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
            .then(res => res.json())
            .then(data => ({ category, meals: data.meals || [] }))
        );

        const results = await Promise.all(fetchPromises);
        
        // จัดเก็บข้อมูลในรูปแบบ { 'Seafood': [...], 'Chicken': [...] }
        const recipesByCategory = results.reduce((acc, result) => {
          acc[result.category] = result.meals;
          return acc;
        }, {});
        
        setAllRecipes(recipesByCategory);
        
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRecipes();
  }, []);

  // 2. สร้างฟังก์ชันที่ซับซ้อนขึ้นเพื่อกรองข้อมูล
  const getDisplayedRecipes = () => {
    let recipes = [];
    
    // กรองตามหมวดหมู่ก่อน
    if (activeCategory === 'All') {
      recipes = Object.values(allRecipes).flat(); // นำเมนูจากทุกหมวดมารวมกัน
    } else {
      recipes = allRecipes[activeCategory] || [];
    }
    
    // จากนั้นกรองตามคำค้นหา
    if (searchTerm) {
      recipes = recipes.filter(recipe => 
        recipe.strMeal.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return recipes;
  };

  const displayedRecipes = getDisplayedRecipes();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          
          {/* 3. เพิ่มช่องค้นหาเข้ามาใน Layout */}
          <div className="md:flex justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold mb-4 md:mb-0 whitespace-nowrap">เมนูอาหาร</h1>
            <div className="w-full md:w-2/3 lg:w-1/2">
              <input 
                type="text"
                placeholder="ค้นหาจากชื่อเมนู..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* ปุ่มตัวกรองหมวดหมู่ (เหมือนเดิม) */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button 
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 font-semibold rounded-full text-sm transition-colors ${activeCategory === 'All' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              ทั้งหมด
            </button>
            {CATEGORIES.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 font-semibold rounded-full text-sm transition-colors ${activeCategory === category ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {loading ? (
            <p>กำลังโหลดข้อมูลเมนู...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedRecipes.map(recipe => (
                <RecipeCard key={recipe.idMeal} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MenuPage;