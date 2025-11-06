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
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [caloriesData, setCaloriesData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [showCaloriesModal, setShowCaloriesModal] = useState(false);
  const QUICK_KEYWORDS = ['ไก่', 'หมู', 'เนื้อ', 'กุ้ง', 'ปลา', 'ผัด', 'แกง', 'ต้ม'];

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
    // Load quick suggestions when opening
    loadSuggestions();
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

  // Live search on input change (debounced)
  useEffect(() => {
    const term = search.trim();
    let cancelled = false;
    if (!term) {
      setResults([]);
      return;
    }
    setLoadingSearch(true);
    const id = setTimeout(async () => {
      try {
        const menus = await searchMenus(term);
        if (!cancelled) setResults(menus);
      } finally {
        if (!cancelled) setLoadingSearch(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [search]);

  const clearSearch = () => {
    setSearch('');
    setResults([]);
    // reload suggestions when clearing
    loadSuggestions();
  };

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const resp = await fetch(`${API_URL}/menus`);
      if (!resp.ok) throw new Error('Failed to load suggestions');
      const data = await resp.json();
      setSuggestions(Array.isArray(data) ? data.slice(0, 12) : []);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
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

  const calculateCalories = async () => {
    if (!token) return;
    setCalculating(true);
    try {
      const resp = await fetch(`${API_URL}/weekly-meal-plan/calculate-calories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to calculate calories');
      }
      const data = await resp.json();
      setCaloriesData(data);
      setShowCaloriesModal(true);
    } catch (error) {
      console.error('Error calculating calories:', error);
      alert(error.message || 'เกิดข้อผิดพลาดในการคำนวณแคลอรี่');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">แผนเมนูรายสัปดาห์</h1>
              <p className="mt-1 text-sm text-gray-500">จัดตารางอาหารของคุณตลอดสัปดาห์ เพิ่มเมนูได้อย่างรวดเร็ว</p>
            </div>
            <div className="flex gap-2">
              <button onClick={calculateCalories} disabled={calculating || !token} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                <span>🔥</span>
                {calculating ? 'กำลังคำนวณ...' : 'คำนวณแคลอรี่'}
              </button>
              <button onClick={generateShoppingList} disabled={generating || !token} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="i-heroicons-shopping-cart-20-solid" />
                {generating ? 'กำลังสร้าง...' : 'สร้างรายการของซื้อ'}
              </button>
            </div>
          </div>
          {loadingPlan && (
            <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>
          )}
          {!loadingPlan && !token && (
            <div className="text-center py-8 text-gray-500">กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้</div>
          )}

          {!loadingPlan && token && (
            <>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
            {DAYS.map(day => (
              <div key={day} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-3 hover:shadow transition-shadow">
                <div className="font-semibold mb-3 text-center text-gray-800 tracking-wide">{day}</div>
                {MEALS.map(meal => (
                  <div key={meal} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 bg-gray-50 rounded px-2 py-1">{meal}</div>
                      <button onClick={() => openAddModal(day, meal)} className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded px-2 py-1 border border-emerald-200 transition-colors">เพิ่ม</button>
                    </div>
                    <div className="space-y-2">
                      {plan[day][meal].map(r => (
                        <div key={r.planId || r.id} className="group flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-transparent hover:border-gray-200">
                          <img src={r.thumb || '/images/no-image.png'} alt="" className="w-10 h-10 object-cover rounded-md ring-1 ring-gray-200" onError={(e) => { e.target.src = '/images/no-image.png'; }} />
                          <div className="text-sm flex-1 truncate text-gray-800" title={r.name}>{r.name}</div>
                          <button onClick={() => removeRecipe({ ...r, day, meal })} className="text-xs text-red-600 hover:text-red-700">ลบ</button>
                        </div>
                      ))}
                      {plan[day][meal].length === 0 && (
                        <div className="inline-flex items-center text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1">ไม่มีเมนู</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center">🛒</div>
              <h2 className="font-semibold text-gray-900">รายการของซื้อ</h2>
              {generating && <span className="text-sm text-gray-500">กำลังสร้าง...</span>}
            </div>
            {shopping.length === 0 ? (
              <div className="text-gray-500 text-sm">ยังไม่มีรายการ กดปุ่ม "สร้างรายการของซื้อ" เพื่อสร้าง</div>
            ) : (
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-2">
                {shopping.map((it, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <div>
                      <span className="font-medium text-gray-800">{it.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
            </>
          )}
        </div>
      </main>

      {showCaloriesModal && caloriesData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 grid place-items-center text-xl">🔥</div>
                <div>
                  <h2 className="font-semibold text-gray-900">ผลการคำนวณแคลอรี่</h2>
                  {caloriesData.calorie_limit && (
                    <p className="text-xs text-gray-500">เป้าหมาย: {caloriesData.calorie_limit} แคลอรี่/วัน</p>
                  )}
                </div>
              </div>
              <button onClick={() => setShowCaloriesModal(false)} className="text-gray-500 hover:text-black text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* แสดงการแจ้งเตือนถ้าเกิน */}
              {caloriesData.has_warnings && caloriesData.warnings && caloriesData.warnings.length > 0 && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <h3 className="font-semibold text-red-800">แจ้งเตือน: แคลอรี่เกินเป้าหมาย</h3>
                  </div>
                  <ul className="space-y-2">
                    {caloriesData.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>{warning.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* สรุปแคลอรี่รวม */}
              <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">แคลอรี่รวมทั้งสัปดาห์:</span>
                  <span className="text-2xl font-bold text-blue-700">{caloriesData.weekly_total || caloriesData.total_calories || 0} kcal</span>
                </div>
                {caloriesData.calorie_limit && (
                  <div className="mt-2 text-xs text-gray-600">
                    เฉลี่ยต่อวัน: {Math.round((caloriesData.weekly_total || 0) / 7)} kcal
                    {caloriesData.calorie_limit && (
                      <span className={`ml-2 ${Math.round((caloriesData.weekly_total || 0) / 7) > caloriesData.calorie_limit ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        (เป้าหมาย: {caloriesData.calorie_limit} kcal/วัน)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* แคลอรี่รายวัน */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">แคลอรี่รายวัน</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DAYS.map(day => {
                    const dayCalories = caloriesData.daily_calories?.[day] || 0;
                    const isOverLimit = caloriesData.calorie_limit && dayCalories > caloriesData.calorie_limit;
                    return (
                      <div key={day} className={`p-3 rounded-lg border ${isOverLimit ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{day}</span>
                          <span className={`text-lg font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-800'}`}>
                            {dayCalories} kcal
                          </span>
                        </div>
                        {caloriesData.calorie_limit && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isOverLimit ? 'bg-red-500' : dayCalories > caloriesData.calorie_limit * 0.9 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, (dayCalories / caloriesData.calorie_limit) * 100)}%` }}
                              ></div>
                            </div>
                            {isOverLimit && (
                              <span className="text-xs text-red-600 font-medium">
                                +{dayCalories - caloriesData.calorie_limit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* แคลอรี่รายมื้อ (ถ้ามี) */}
              {caloriesData.meal_details && Object.keys(caloriesData.meal_details).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">แคลอรี่รายมื้อ</h3>
                  <div className="space-y-3">
                    {DAYS.map(day => {
                      const mealDetails = caloriesData.meal_details[day];
                      if (!mealDetails) return null;
                      return (
                        <div key={day} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">{day}</div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            {MEALS.map(meal => (
                              <div key={meal} className="text-center">
                                <div className="text-gray-500 mb-1">{meal}</div>
                                <div className="font-semibold text-gray-800">
                                  {mealDetails[meal] || 0} kcal
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {caloriesData.message && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
                  {caloriesData.message}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50">
              <button 
                onClick={() => setShowCaloriesModal(false)} 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-0 md:p-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
              <div className="font-semibold">เพิ่มเมนู • {modalTarget.day} / {modalTarget.meal}</div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <div className="max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white px-4 pt-3 pb-3 border-b">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อเมนู..." className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                  <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700" disabled={loadingSearch}>
                    {loadingSearch ? 'ค้นหา...' : 'ค้นหา'}
                  </button>
                  {search && (
                    <button type="button" onClick={clearSearch} className="px-3 py-2 text-sm text-gray-600 hover:text-black">
                      ล้าง
                    </button>
                  )}
                </form>
                <div className="mt-2 flex items-start">
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 pr-1">
                      {QUICK_KEYWORDS.map(kw => (
                        <button
                          key={kw}
                          onClick={() => { setSearch(kw); }}
                          className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 whitespace-nowrap"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pt-3">
                {!search.trim() && (
                  <details className="mb-3" open>
                    <summary className="cursor-pointer select-none text-sm text-gray-700 mb-2">เมนูแนะนำ</summary>
                    <div className="mb-2">
                      {loadingSuggestions && <div className="text-xs text-gray-500">กำลังโหลด...</div>}
                      {(!loadingSuggestions && suggestions.length === 0) ? (
                        <div className="text-xs text-gray-400">ไม่มีเมนูแนะนำ</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {suggestions.map(menu => (
                            <div key={menu.menu_id} className="border rounded-lg overflow-hidden bg-white">
                              <img src={menu.menu_image || '/images/no-image.png'} alt="" className="w-full h-24 object-cover" onError={(e) => { e.target.src = '/images/no-image.png'; }} />
                              <div className="p-2">
                                <div className="text-sm font-medium truncate" title={menu.menu_name}>{menu.menu_name}</div>
                                <button onClick={() => addRecipeToTarget(menu)} className="mt-2 w-full text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1">เพิ่ม</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="max-h-[55vh] md:max-h-[60vh] overflow-y-auto divide-y rounded-lg border">
                  {results.map(menu => (
                    <div key={menu.menu_id} className="p-2 flex items-center gap-3 hover:bg-gray-50">
                      <img src={menu.menu_image || '/images/no-image.png'} alt="" className="w-14 h-14 rounded-md object-cover ring-1 ring-gray-200" onError={(e) => { e.target.src = '/images/no-image.png'; }} />
                      <div className="flex-1">
                        <div className="font-medium truncate text-gray-800" title={menu.menu_name}>{menu.menu_name}</div>
                        {menu.menu_description && (
                          <div className="text-xs text-gray-500 line-clamp-2">{menu.menu_description}</div>
                        )}
                      </div>
                      <button onClick={() => addRecipeToTarget(menu)} className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded px-3 py-1 border border-emerald-200">เพิ่ม</button>
                    </div>
                  ))}
                  {results.length === 0 && !loadingSearch && (
                    <div className="p-4 text-center text-gray-500">พิมพ์ชื่อเมนูแล้วกดค้นหา</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklyMealPlanPage;