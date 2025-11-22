import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RecipeCard from '../components/RecipeCard'; // ใช้ RecipeCard เดิม

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q'); // 1. ดึงคำค้นหา (q) มาจาก URL

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. ใช้ useEffect เพื่อดึงข้อมูลทุกครั้งที่คำค้นหา (query) ใน URL เปลี่ยนไป
  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/thai-food/filter.php?i=${query}`);
        const data = await response.json();
        setRecipes(data.meals || []);
      } catch (error) {
        console.error("Failed to fetch from TheMealDB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">ผลการค้นหาสำหรับ: "{query}"</h1>
          
          {loading ? (
            <p>กำลังค้นหาใน TheMealDB...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-8">พบ {recipes.length} เมนู</p>
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {recipes.map(recipe => (
                    <RecipeCard key={recipe.idMeal} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg text-gray-500">ไม่พบเมนูจากวัตถุดิบนี้ใน TheMealDB</p>
                  <Link to="/" className="mt-4 inline-block text-green-600 font-semibold hover:underline">
                    กลับไปที่หน้าหลักเพื่อค้นหาใหม่
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default SearchPage;