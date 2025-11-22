import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RecipeCard from '../components/RecipeCard';

// 1. กำหนดหมวดหมู่ (ใช้ข้อมูลจากฐานข้อมูล)
const CATEGORIES = ['Thai Food']; // ใช้หมวดหมู่อาหารไทย

function MenuPage() {
  const [allRecipes, setAllRecipes] = useState([]); // State สำหรับเก็บเมนูทั้งหมด
  const [activeCategory, setActiveCategory] = useState('All'); // State สำหรับหมวดหมู่ที่ถูกเลือก
  const [searchTerm, setSearchTerm] = useState(''); // State สำหรับคำค้นหา
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllRecipes = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลทั้งหมดจาก API ใหม่ (ใช้ข้อมูลจากฐานข้อมูล)
        // ถ้าไม่มี category ให้ดึงทั้งหมด
        const response = await fetch(`http://localhost:3000/api/thai-food/filter.php`);
        const data = await response.json();
        const meals = data.meals || [];
        
        setAllRecipes(meals);
        
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