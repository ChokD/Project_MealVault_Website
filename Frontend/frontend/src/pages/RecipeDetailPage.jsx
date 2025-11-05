import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const STORAGE_KEY = 'weeklyMealPlan';

function addToWeeklyPlan({ idMeal, strMeal, strMealThumb }, day, meal) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = createEmptyPlan();
    const plan = raw ? { ...base, ...JSON.parse(raw) } : base;
    if (!Array.isArray(plan?.[day]?.[meal])) plan[day][meal] = [];
    const exists = plan[day][meal].some(r => r.id === idMeal);
    if (!exists) plan[day][meal].push({ id: idMeal, name: strMeal, thumb: strMealThumb });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    return true;
  } catch {
    return false;
  }
}

function createEmptyPlan() {
  const plan = {};
  for (const d of DAYS) {
    plan[d] = {};
    for (const m of MEALS) plan[d][m] = [];
  }
  return plan;
}

function RecipeDetailPage() {
  const { recipeId } = useParams(); // ดึง ID ของเมนูมาจาก URL
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickDay, setPickDay] = useState('Mon');
  const [pickMeal, setPickMeal] = useState('dinner');
  const [added, setAdded] = useState('');

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
        const data = await response.json();
        setRecipe(data.meals ? data.meals[0] : null);
      } catch (error) {
        console.error("Failed to fetch recipe details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipeDetails();
  }, [recipeId]);

  // ฟังก์ชันสำหรับจัดรูปแบบวัตถุดิบและปริมาณ
  const getIngredients = (recipeData) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipeData[`strIngredient${i}`];
      const measure = recipeData[`strMeasure${i}`];
      if (ingredient && ingredient.trim() !== "") {
        ingredients.push(`${ingredient} - ${measure}`);
      }
    }
    return ingredients;
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow flex items-center justify-center"><p>กำลังโหลดข้อมูลสูตรอาหาร...</p></main>
        </div>
    );
  }

  if (!recipe) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow flex items-center justify-center"><h1 className="text-2xl font-bold">ไม่พบสูตรอาหารนี้</h1></main>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-4">{recipe.strMeal}</h1>
            <p className="text-gray-500 mb-6">{recipe.strCategory} | {recipe.strArea}</p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-6 flex items-center gap-2">
              <div className="text-sm">เพิ่มลงแผนสัปดาห์:</div>
              <select value={pickDay} onChange={(e) => setPickDay(e.target.value)} className="border rounded px-2 py-1 text-sm">
                {DAYS.map(d => (<option key={d} value={d}>{d}</option>))}
              </select>
              <select value={pickMeal} onChange={(e) => setPickMeal(e.target.value)} className="border rounded px-2 py-1 text-sm">
                {MEALS.map(m => (<option key={m} value={m}>{m}</option>))}
              </select>
              <button
                onClick={() => { if (addToWeeklyPlan(recipe, pickDay, pickMeal)) setAdded('เพิ่มแล้ว!'); }}
                className="bg-emerald-600 text-white rounded px-3 py-1 text-sm hover:bg-emerald-700"
              >เพิ่ม</button>
              {added && <span className="text-emerald-700 text-sm">{added}</span>}
            </div>
            
            <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full rounded-lg mb-6 shadow-md" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h2 className="text-2xl font-bold mb-4">วัตถุดิบ</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {getIngredients(recipe).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">วิธีทำ</h2>
                <div className="prose max-w-none text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>
                  {recipe.strInstructions}
                </div>
              </div>
            </div>
            
            {recipe.strYoutube && (
              <div className="mt-8 text-center">
                <a href={recipe.strYoutube} target="_blank" rel="noopener noreferrer" className="inline-block bg-red-600 text-white font-bold rounded-full px-6 py-3 hover:bg-red-700 transition-colors">
                  ดูวิดีโอวิธีทำบน YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RecipeDetailPage;