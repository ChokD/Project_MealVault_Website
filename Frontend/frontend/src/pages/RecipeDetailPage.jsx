import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const API_URL = 'http://localhost:3000/api';

async function fetchPlanFromAPI(token) {
  try {
    const resp = await fetch(`${API_URL}/weekly-meal-plan`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error('Error fetching plan:', error);
    return null;
  }
}

async function findMenuIdByName(menuName) {
  try {
    const resp = await fetch(`${API_URL}/menus/search?q=${encodeURIComponent(menuName)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    // หาเมนูที่ชื่อตรงกัน
    const menu = data.find(m => m.menu_name === menuName);
    return menu ? menu.menu_id : null;
  } catch (error) {
    console.error('Error finding menu:', error);
    return null;
  }
}

async function addMenuToPlan(day, mealType, menuId, token) {
  try {
    const resp = await fetch(`${API_URL}/weekly-meal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        day,
        meal_type: mealType,
        menu_id: menuId
      })
    });
    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(errorData.error || errorData.message || 'Failed to add menu');
    }
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error('Error adding menu:', error);
    throw error;
  }
}

function RecipeDetailPage() {
  const { recipeId } = useParams(); // ดึง ID ของเมนูมาจาก URL
  const { token } = useContext(AuthContext);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickDay, setPickDay] = useState('Mon');
  const [pickMeal, setPickMeal] = useState('dinner');
  const [added, setAdded] = useState('');
  const [plan, setPlan] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/thai-food/lookup.php?i=${recipeId}`);
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

  // โหลด plan และ menu_id เมื่อ recipe โหลดเสร็จและมี token
  useEffect(() => {
    if (recipe && token) {
      const loadPlanAndMenuId = async () => {
        setLoadingPlan(true);
        try {
          // หา menu_id
          const id = await findMenuIdByName(recipe.strMeal);
          if (id) setMenuId(id);
          
          // ดึง plan
          const planData = await fetchPlanFromAPI(token);
          setPlan(planData);
        } finally {
          setLoadingPlan(false);
        }
      };
      loadPlanAndMenuId();
    }
  }, [recipe, token]);

  // Reload plan เมื่อเปลี่ยนวันหรือมื้อ
  useEffect(() => {
    if (token && recipe) {
      fetchPlanFromAPI(token).then(planData => {
        if (planData) setPlan(planData);
      });
    }
  }, [pickDay, pickMeal, token, recipe]);

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
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-6">
              <div className="text-sm font-medium mb-3">เพิ่มลงแผนสัปดาห์:</div>
              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={pickDay} 
                  onChange={(e) => setPickDay(e.target.value)} 
                  className="border rounded px-3 py-2 text-sm"
                >
                  {DAYS.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
                <div className="flex gap-2">
                  {MEALS.map(meal => {
                    // ตรวจสอบว่าเมนูปัจจุบันถูกเลือกไปแล้วในวัน/มื้อนี้หรือไม่
                    const isCurrentMenuSelected = plan && menuId && plan[pickDay]?.[meal]?.some(m => m.id === menuId);
                    // ตรวจสอบว่ามีเมนูอื่นอยู่แล้วในวัน/มื้อนี้หรือไม่
                    const isSlotOccupied = plan && plan[pickDay]?.[meal]?.length > 0;
                    const isCurrentSelection = pickMeal === meal;
                    
                    return (
                      <button
                        key={meal}
                        onClick={() => {
                          if (!isCurrentMenuSelected) {
                            setPickMeal(meal);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg border-2 text-sm transition-colors ${
                          isCurrentSelection
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isCurrentMenuSelected
                            ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed opacity-75'
                            : isSlotOccupied
                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={isCurrentMenuSelected}
                      >
                        {meal}
                        {isCurrentMenuSelected && <span className="ml-1 text-xs">✓</span>}
                        {isSlotOccupied && !isCurrentMenuSelected && <span className="ml-1 text-xs">(มีอื่น)</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={async () => {
                    if (!token) {
                      alert('กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้');
                      return;
                    }
                    if (!menuId) {
                      alert('ไม่พบเมนูนี้ในฐานข้อมูล กรุณาเพิ่มเมนูในฐานข้อมูลก่อน');
                      return;
                    }
                    
                    // ตรวจสอบว่าเมนูถูกเลือกไปแล้วหรือยัง
                    const isAlreadySelected = plan && menuId && plan[pickDay]?.[pickMeal]?.some(m => m.id === menuId);
                    if (isAlreadySelected) {
                      alert('เมนูนี้ถูกเลือกไปแล้วในวัน/มื้อนี้');
                      return;
                    }
                    
                    setAdding(true);
                    try {
                      await addMenuToPlan(pickDay, pickMeal, menuId, token);
                      setAdded('เพิ่มแล้ว!');
                      setTimeout(() => setAdded(''), 3000);
                      
                      // Reload plan
                      const planData = await fetchPlanFromAPI(token);
                      setPlan(planData);
                    } catch (error) {
                      alert(error.message || 'เกิดข้อผิดพลาดในการเพิ่มเมนู');
                    } finally {
                      setAdding(false);
                    }
                  }}
                  disabled={adding || !token || !menuId || (plan && menuId && plan[pickDay]?.[pickMeal]?.some(m => m.id === menuId))}
                  className="bg-emerald-600 text-white rounded px-4 py-2 text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'กำลังเพิ่ม...' : (plan && menuId && plan[pickDay]?.[pickMeal]?.some(m => m.id === menuId) ? 'ถูกเลือกแล้ว' : 'เพิ่ม')}
                </button>
                {added && <span className="text-emerald-700 text-sm font-medium">{added}</span>}
              </div>
              {!token && (
                <div className="mt-2 text-xs text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้</div>
              )}
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