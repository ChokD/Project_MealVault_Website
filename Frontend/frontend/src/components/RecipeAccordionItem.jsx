import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function RecipeAccordionItem({ recipe, isOpen, onToggle }) {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ฟังก์ชันสำหรับดึงข้อมูลรายละเอียด (จะทำงานเมื่อถูกเปิดครั้งแรก)
  useEffect(() => {
    const fetchRecipeDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
        const data = await response.json();
        setDetails(data.meals ? data.meals[0] : null);
      } catch (error) {
        console.error("Failed to fetch recipe details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && !details) {
      fetchRecipeDetails();
    }
  }, [isOpen, details, recipe.idMeal]);
  
  // ฟังก์ชันสำหรับจัดรูปแบบวัตถุดิบ
  const getIngredients = (recipeData) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipeData[`strIngredient${i}`];
      const measure = recipeData[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== "") {
        ingredients.push({ ingredient, measure });
      }
    }
    return ingredients;
  };


  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* ส่วนหัวของแถบที่คลิกได้ */}
      <div 
        className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-4">
            <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-16 h-16 rounded-lg object-cover" />
            <div>
                <h3 className="font-bold text-lg text-gray-800">{recipe.strMeal}</h3>
                <p className="text-sm text-gray-500">{recipe.strCategory} / {recipe.strArea}</p>
            </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9L12 16L5 9" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* ส่วนเนื้อหาที่จะขยายออกมา */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t p-6">
              {isLoading && <p>กำลังโหลดรายละเอียด...</p>}
              {details && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">วิธีทำ</h2>
                  <div className="prose max-w-none text-gray-700 mb-6" style={{ whiteSpace: 'pre-wrap' }}>
                    {details.strInstructions}
                  </div>
                  <h2 className="text-2xl font-bold mb-4">วัตถุดิบ</h2>
                  <ul className="list-disc list-inside space-y-1">
                    {getIngredients(details).map((item, index) => (
                      <li key={index}><strong>{item.ingredient}</strong>: {item.measure}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RecipeAccordionItem;