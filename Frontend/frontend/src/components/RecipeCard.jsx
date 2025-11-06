import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

function RecipeCard({ recipe }) {
  const { token } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedMeal, setSelectedMeal] = useState('dinner');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [menuId, setMenuId] = useState(null);

  const categoryAndArea = [recipe.strCategory, recipe.strArea]
    .filter(Boolean)
    .join(' / ');

  const openModal = async () => {
    if (!token) {
      alert('กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้');
      return;
    }
    setIsModalOpen(true);
    setLoading(true);
    try {
      // หา menu_id ก่อน
      const id = await findMenuIdByName(recipe.strMeal);
      if (id) setMenuId(id);
      
      // ดึง plan
      const planData = await fetchPlanFromAPI(token);
      setPlan(planData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlan = async () => {
    if (!token) return;
    if (!menuId) {
      alert('ไม่พบเมนูนี้ในฐานข้อมูล กรุณาเพิ่มเมนูในฐานข้อมูลก่อน');
      return;
    }
    
    // ตรวจสอบว่าเมนูถูกเลือกไปแล้วหรือยัง
    const isAlreadySelected = plan && menuId && plan[selectedDay]?.[selectedMeal]?.some(m => m.id === menuId);
    if (isAlreadySelected) {
      alert('เมนูนี้ถูกเลือกไปแล้วในวัน/มื้อนี้');
      return;
    }
    
    setAdding(true);
    try {
      await addMenuToPlan(selectedDay, selectedMeal, menuId, token);
      alert('เพิ่มเมนูสำเร็จ!');
      
      // Reload plan หลังจากเพิ่มเมนู
      const planData = await fetchPlanFromAPI(token);
      setPlan(planData);
      
      // ปิด modal
      setIsModalOpen(false);
    } catch (error) {
      alert(error.message || 'เกิดข้อผิดพลาดในการเพิ่มเมนู');
    } finally {
      setAdding(false);
    }
  };

  // Reset menuId เมื่อปิด modal
  useEffect(() => {
    if (!isModalOpen) {
      setMenuId(null);
      setPlan(null);
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group relative">
        <Link to={`/menus/${recipe.idMeal}`} className="block">
          <div className="relative overflow-hidden">
            <img className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" src={recipe.strMealThumb} alt={recipe.strMeal} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-lg mb-2 truncate text-gray-800 group-hover:text-green-600 transition-colors" title={recipe.strMeal}>{recipe.strMeal}</h3>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">{categoryAndArea}</p>
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal();
          }}
          className="absolute top-2 right-2 bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-emerald-700 shadow-lg z-10"
        >
          เพิ่มลงแผน
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">เพิ่มเมนู: {recipe.strMeal}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black text-2xl">✕</button>
            </div>

            {loading ? (
              <div className="text-center py-8">กำลังโหลด...</div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">เลือกวัน:</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">เลือกมื้อ:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MEALS.map(meal => {
                      // ตรวจสอบว่าเมนูปัจจุบันถูกเลือกไปแล้วในวัน/มื้อนี้หรือไม่
                      const isCurrentMenuSelected = plan && menuId && plan[selectedDay]?.[meal]?.some(m => m.id === menuId);
                      // ตรวจสอบว่ามีเมนูอื่นอยู่แล้วในวัน/มื้อนี้หรือไม่
                      const isSlotOccupied = plan && plan[selectedDay]?.[meal]?.length > 0;
                      const isCurrentSelection = selectedMeal === meal;
                      
                      return (
                        <button
                          key={meal}
                          onClick={() => {
                            // อนุญาตให้คลิกได้เสมอ (ไม่ disable)
                            if (!isCurrentMenuSelected) {
                              setSelectedMeal(meal);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            isCurrentSelection
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : isCurrentMenuSelected
                              ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed opacity-75'
                              : isSlotOccupied
                              ? 'bg-orange-100 border-orange-300 text-orange-700'
                              : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {meal}
                          {isCurrentMenuSelected && <span className="block text-xs mt-1">✓ เลือกแล้ว</span>}
                          {isSlotOccupied && !isCurrentMenuSelected && <span className="block text-xs mt-1">(มีเมนูอื่น)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToPlan}
                    disabled={adding || !menuId || (plan && menuId && plan[selectedDay]?.[selectedMeal]?.some(m => m.id === menuId))}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? 'กำลังเพิ่ม...' : (plan && menuId && plan[selectedDay]?.[selectedMeal]?.some(m => m.id === menuId) ? 'ถูกเลือกแล้ว' : 'เพิ่มเมนู')}
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default RecipeCard;
