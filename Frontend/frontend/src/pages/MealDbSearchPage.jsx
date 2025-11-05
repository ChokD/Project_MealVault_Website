import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RecipeCard from '../components/RecipeCard'; // เราจะใช้ RecipeCard เดิมที่สวยงามของเรา

function MealDbSearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q'); // ดึงคำค้นหาจาก URL (เช่น /search?q=chicken)

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังก์ชันนี้จะทำงานเมื่อมีคำค้นหาใน URL เท่านั้น
    if (!query) {
      setLoading(false);
      return;
    }
    
    const fetchRecipesByIngredient = async () => {
      setLoading(true);
      try {
        // ยิง API ไปที่ API ใหม่เพื่อกรองด้วยวัตถุดิบ
        const response = await fetch(`http://localhost:3000/api/thai-food/filter.php?i=${query}`);
        const data = await response.json();
        setRecipes(data.meals || []);
      } catch (error) {
        console.error("Failed to fetch from TheMealDB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipesByIngredient();
  }, [query]); // ให้ฟังก์ชันนี้ทำงานใหม่ทุกครั้งที่คำค้นหาใน URL เปลี่ยนไป

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">ผลการค้นหาสำหรับ: "{query}"</h1>
          <p className="text-gray-600 mb-8">พบ {recipes.length} เมนูจาก TheMealDB</p>
          
          {loading ? (
            <p>กำลังค้นหาใน TheMealDB...</p>
          ) : (
            recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {recipes.map(recipe => (
                        <RecipeCard key={recipe.idMeal} recipe={recipe} />
                    ))}
                </div>
            ) : (
                <p>ไม่พบเมนูจากวัตถุดิบนี้ใน TheMealDB</p>
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default MealDbSearchPage;