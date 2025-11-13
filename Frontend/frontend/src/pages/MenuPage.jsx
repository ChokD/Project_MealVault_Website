import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RecipeCard from '../components/RecipeCard';

function MenuPage() {
  const [allRecipes, setAllRecipes] = useState([]); // State สำหรับเก็บเมนูทั้งหมด
  const [categories, setCategories] = useState([]); // State สำหรับเก็บหมวดหมู่ทั้งหมด
  const [activeCategory, setActiveCategory] = useState('All'); // State สำหรับหมวดหมู่ที่ถูกเลือก
  const [searchTerm, setSearchTerm] = useState(''); // State สำหรับคำค้นหา
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ดึงหมวดหมู่ทั้งหมด
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/categories');
        const data = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ดึงเมนูตามหมวดหมู่ที่เลือก
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        // สร้าง URL สำหรับดึงเมนู
        let url = 'http://localhost:3000/api/thai-food/filter.php';
        if (activeCategory && activeCategory !== 'All') {
          url += `?c=${encodeURIComponent(activeCategory)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        const meals = data.meals || [];
        
        setAllRecipes(meals);
        
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [activeCategory]);

  // กรองเมนูตามคำค้นหา
  const getDisplayedRecipes = () => {
    let recipes = [...allRecipes];
    
    // กรองตามคำค้นหา
    if (searchTerm) {
      recipes = recipes.filter(recipe => 
        recipe.strMeal && recipe.strMeal.toLowerCase().includes(searchTerm.toLowerCase())
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
          
          {/* Header และช่องค้นหา */}
          <div className="md:flex justify-between items-center mb-6 gap-4">
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

          {/* ตัวกรองหมวดหมู่ */}
          {!categoriesLoading && categories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">กรองตามวิธีทำอาหาร:</h2>
              <div className="flex flex-wrap gap-3">
                {/* ปุ่ม "ทั้งหมด" */}
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                    activeCategory === 'All'
                      ? 'bg-green-500 text-white shadow-md transform scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  ทั้งหมด
                </button>
                
                {/* ปุ่มหมวดหมู่ต่างๆ */}
                {categories.map((category) => (
                  <button
                    key={category.category_id}
                    onClick={() => setActiveCategory(category.category_name)}
                    className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
                      activeCategory === category.category_name
                        ? 'bg-green-500 text-white shadow-md transform scale-105'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-16">
              <p className="text-lg text-gray-500">กำลังโหลดข้อมูลเมนู...</p>
            </div>
          ) : displayedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedRecipes.map(recipe => (
                <RecipeCard key={recipe.idMeal} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-gray-500 mb-4">
                {searchTerm ? 'ไม่พบเมนูที่ค้นหา' : 'ยังไม่มีข้อมูลเมนู กรุณานำเข้าข้อมูลจาก Excel ก่อน'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-400">
                  รันคำสั่ง: <code className="bg-gray-100 px-2 py-1 rounded">cd Backend; node scripts/importExcelData.js</code>
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MenuPage;