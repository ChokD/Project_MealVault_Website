import React, { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const API_URL = 'http://localhost:3000/api';

function createEmptyPlan() {
  const plan = {};
  for (const day of DAYS) {
    plan[day] = {};
    for (const meal of MEALS) {
      plan[day][meal] = [];
    }
  }
  return plan;
}

async function fetchPlanFromAPI(token) {
  try {
    const resp = await fetch(`${API_URL}/weekly-meal-plan`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!resp.ok) throw new Error('Failed to fetch plan');
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error('Error fetching plan:', error);
    return createEmptyPlan();
  }
}

async function searchMenus(query) {
  try {
    const resp = await fetch(`${API_URL}/menus/search?q=${encodeURIComponent(query)}`);
    if (!resp.ok) throw new Error('Failed to search menus');
    const data = await resp.json();
    return data || [];
  } catch (error) {
    console.error('Error searching menus:', error);
    return [];
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
      console.error('API Error Response:', errorData);
      // ใช้ error message ที่ชัดเจนขึ้น
      const errorMsg = errorData.error || errorData.message || 'Failed to add menu';
      throw new Error(errorMsg);
    }
    const data = await resp.json();
    return data;
  } catch (error) {
    console.error('Error adding menu:', error);
    throw error;
  }
}

async function removeMenuFromPlan(planId, token) {
  try {
    const resp = await fetch(`${API_URL}/weekly-meal-plan/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!resp.ok) throw new Error('Failed to remove menu');
    return true;
  } catch (error) {
    console.error('Error removing menu:', error);
    throw error;
  }
}

async function generateShoppingListFromAPI(token) {
  try {
    const resp = await fetch(`${API_URL}/weekly-meal-plan/shopping-list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!resp.ok) throw new Error('Failed to generate shopping list');
    const data = await resp.json();
    return data || [];
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return [];
  }
}

function WeeklyMealPlanPage() {
  const { token } = useContext(AuthContext);
  const [plan, setPlan] = useState(createEmptyPlan());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState({ day: null, meal: null });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [shopping, setShopping] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    if (token) {
      loadPlan();
    } else {
      setLoadingPlan(false);
    }
  }, [token]);

  const loadPlan = async () => {
    setLoadingPlan(true);
    try {
      const data = await fetchPlanFromAPI(token);
      setPlan(data);
    } finally {
      setLoadingPlan(false);
    }
  };

  const openAddModal = (day, meal) => {
    setModalTarget({ day, meal });
    setSearch('');
    setResults([]);
    setIsModalOpen(true);
  };

  const addRecipeToTarget = async (menu) => {
    if (!modalTarget.day || !modalTarget.meal || !token) return;
    try {
      const newItem = await addMenuToPlan(modalTarget.day, modalTarget.meal, menu.menu_id, token);
      setPlan(prev => {
        const next = { ...prev, [modalTarget.day]: { ...prev[modalTarget.day] } };
        const list = [...next[modalTarget.day][modalTarget.meal]];
        // avoid duplicates in same slot
        if (!list.some(r => r.id === newItem.id)) {
          list.push(newItem);
        }
        next[modalTarget.day][modalTarget.meal] = list;
        return next;
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error in addRecipeToTarget:', error);
      const errorMsg = error.message || 'เกิดข้อผิดพลาดในการเพิ่มเมนู';
      alert(errorMsg);
    }
  };

  const removeRecipe = async (item) => {
    if (!item.planId || !token) return;
    try {
      await removeMenuFromPlan(item.planId, token);
      setPlan(prev => {
        const next = { ...prev, [item.day]: { ...prev[item.day] } };
        next[item.day][item.meal] = prev[item.day][item.meal].filter(r => r.planId !== item.planId);
        return next;
      });
    } catch (error) {
      alert(error.message || 'เกิดข้อผิดพลาดในการลบเมนู');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoadingSearch(true);
    try {
      const menus = await searchMenus(search.trim());
      setResults(menus);
    } finally {
      setLoadingSearch(false);
    }
  };

  const generateShoppingList = async () => {
    if (!token) return;
    setGenerating(true);
    try {
      const list = await generateShoppingListFromAPI(token);
      setShopping(list);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">แผนเมนูรายสัปดาห์</h1>
            <button onClick={generateShoppingList} disabled={generating || !token} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? 'กำลังสร้าง...' : 'สร้างรายการของซื้อ'}
            </button>
          </div>
          {loadingPlan && (
            <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>
          )}
          {!loadingPlan && !token && (
            <div className="text-center py-8 text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้</div>
          )}

          {!loadingPlan && token && (
            <>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
            {DAYS.map(day => (
              <div key={day} className="bg-white rounded-xl shadow p-3">
                <div className="font-semibold mb-2 text-center">{day}</div>
                {MEALS.map(meal => (
                  <div key={meal} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-gray-600">{meal}</div>
                      <button onClick={() => openAddModal(day, meal)} className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1">+
                      </button>
                    </div>
                    <div className="space-y-2">
                      {plan[day][meal].map(r => (
                        <div key={r.planId || r.id} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                          <img src={r.thumb || '/images/no-image.png'} alt="" className="w-10 h-10 object-cover rounded" onError={(e) => { e.target.src = '/images/no-image.png'; }} />
                          <div className="text-sm flex-1 truncate" title={r.name}>{r.name}</div>
                          <button onClick={() => removeRecipe({ ...r, day, meal })} className="text-red-600 text-xs hover:underline">ลบ</button>
                        </div>
                      ))}
                      {plan[day][meal].length === 0 && (
                        <div className="text-xs text-gray-400">ไม่มีเมนู</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold">รายการของซื้อ</h2>
              {generating && <span className="text-sm text-gray-500">กำลังสร้าง...</span>}
            </div>
            {shopping.length === 0 ? (
              <div className="text-gray-500 text-sm">ยังไม่มีรายการ กดปุ่ม "สร้างรายการของซื้อ" เพื่อสร้าง</div>
            ) : (
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-1">
                {shopping.map((it, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-medium">{it.name}</span>
                    {it.measure && <span className="text-gray-600"> — {it.measure}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
            </>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">เพิ่มเมนู • {modalTarget.day} / {modalTarget.meal}</div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อเมนู..." className="border rounded px-3 py-2 flex-1" />
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700" disabled={loadingSearch}>
                {loadingSearch ? 'ค้นหา...' : 'ค้นหา'}
              </button>
            </form>
            <div className="max-h-96 overflow-auto divide-y">
              {results.map(menu => (
                <div key={menu.menu_id} className="p-2 flex items-center gap-3">
                  <img src={menu.menu_image || '/images/no-image.png'} alt="" className="w-14 h-14 rounded object-cover" onError={(e) => { e.target.src = '/images/no-image.png'; }} />
                  <div className="flex-1">
                    <div className="font-medium">{menu.menu_name}</div>
                    {menu.menu_description && (
                      <div className="text-xs text-gray-500 line-clamp-2">{menu.menu_description}</div>
                    )}
                  </div>
                  <button onClick={() => addRecipeToTarget(menu)} className="text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1">เพิ่ม</button>
                </div>
              ))}
              {results.length === 0 && !loadingSearch && (
                <div className="p-4 text-center text-gray-500">พิมพ์ชื่อเมนูแล้วกดค้นหา</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklyMealPlanPage;