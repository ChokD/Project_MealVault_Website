import React, { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import ClearPlanModal from '../components/ClearPlanModal';
import { API_URL } from '../config/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

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
    // รองรับทั้งรูปแบบเก่า (array) และรูปแบบใหม่ (object)
    if (Array.isArray(data)) {
      // แปลง array เก่าเป็น object ใหม่ (รวมทั้งหมดไว้ในวันแรก)
      const result = {};
      DAYS.forEach(day => {
        result[day] = [];
      });
      if (data.length > 0) {
        result[DAYS[0]] = data;
      }
      return result;
    }
    return data || {};
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return {};
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
  const [shopping, setShopping] = useState({});
  const [generating, setGenerating] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [clearingPlan, setClearingPlan] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
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

  const clearWeeklyPlan = async () => {
    if (!token) return;
    setClearingPlan(true);
    try {
      const resp = await fetch(`${API_URL}/weekly-meal-plan`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resp.ok) throw new Error('Failed to clear plan');
      setPlan(createEmptyPlan());
      setShopping({});
      setIsModalOpen(false);
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing weekly meal plan:', error);
      alert(error.message || 'เกิดข้อผิดพลาดในการล้างแผนเมนู');
    } finally {
      setClearingPlan(false);
    }
  };

  const downloadShoppingList = () => {
    const hasItems = Object.values(shopping).some(dayList => dayList.length > 0);
    if (!hasItems) {
      alert('ยังไม่มีรายการซื้อของ กรุณาสร้างรายการก่อน');
      return;
    }

    const dayNames = {
      'Sun': 'อาทิตย์',
      'Mon': 'จันทร์',
      'Tue': 'อังคาร',
      'Wed': 'พุธ',
      'Thu': 'พฤหัสบดี',
      'Fri': 'ศุกร์',
      'Sat': 'เสาร์'
    };

    let itemsHtml = '';
    for (const day of DAYS) {
      if (shopping[day] && shopping[day].length > 0) {
        itemsHtml += `
          <div class="day-section">
            <h2 class="day-title">วัน${dayNames[day]}</h2>
            <ul>
              ${shopping[day].map((item, idx) => `
                <li>
                  <span class="item-name">${idx + 1}. ${item.name}</span>
                  ${item.measure ? `<span class="item-measure">(${item.measure})</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
    }

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>รายการซื้อของ - MealVault</title>
          <style>
            @media print {
              @page {
                margin: 0.8cm;
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 0;
              margin: 0;
              max-width: 100%;
            }
            h1 {
              color: #059669;
              border-bottom: 2px solid #059669;
              padding-bottom: 8px;
              margin-top: 0;
              margin-bottom: 12px;
              font-size: 24px;
            }
            .date {
              color: #666;
              margin-bottom: 15px;
              font-size: 14px;
            }
            .day-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .day-title {
              color: #059669;
              font-size: 18px;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px solid #ddd;
              margin-top: 0;
            }
            ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            li {
              padding: 6px 0;
              border-bottom: 1px solid #eee;
              font-size: 15px;
            }
            li:last-child {
              border-bottom: none;
            }
            .item-name {
              font-weight: 600;
              color: #333;
            }
            .item-measure {
              color: #666;
              margin-left: 8px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #999;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <h1>รายการซื้อของ</h1>
          <div class="date">วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}</div>
          ${itemsHtml}
          <div class="footer">
            สร้างโดย MealVault - แผนเมนูรายสัปดาห์
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const saveShoppingList = () => {
    const hasItems = Object.values(shopping).some(dayList => dayList.length > 0);
    if (!hasItems) {
      alert('ยังไม่มีรายการซื้อของ กรุณาสร้างรายการก่อน');
      return;
    }

    const dateStr = new Date().toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });

    const dayNames = {
      'Sun': 'อาทิตย์',
      'Mon': 'จันทร์',
      'Tue': 'อังคาร',
      'Wed': 'พุธ',
      'Thu': 'พฤหัสบดี',
      'Fri': 'ศุกร์',
      'Sat': 'เสาร์'
    };

    // สร้างเนื้อหาไฟล์
    let content = `รายการซื้อของ - MealVault\n`;
    content += `วันที่สร้าง: ${dateStr}\n`;
    content += `${'='.repeat(40)}\n\n`;
    
    for (const day of DAYS) {
      if (shopping[day] && shopping[day].length > 0) {
        content += `วัน${dayNames[day]}\n`;
        content += `${'-'.repeat(30)}\n`;
        shopping[day].forEach((item, idx) => {
          content += `${idx + 1}. ${item.name}`;
          if (item.measure) {
            content += ` (${item.measure})`;
          }
          content += '\n';
        });
        content += '\n';
      }
    }

    content += `${'='.repeat(40)}\n`;
    content += `สร้างโดย MealVault - แผนเมนูรายสัปดาห์\n`;

    // สร้าง Blob และดาวน์โหลด
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายการซื้อของ_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasPlannedMenus = Object.values(plan).some(day =>
    Object.values(day).some(mealList => mealList.length > 0)
  );

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearModal(true)}
                disabled={!token || clearingPlan || !hasPlannedMenus}
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="i-heroicons-trash-20-solid" />
                {clearingPlan ? 'กำลังล้าง...' : 'ล้าง'}
              </button>
              <button onClick={generateShoppingList} disabled={generating || !token} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="i-heroicons-shopping-cart-20-solid" />
                {generating ? 'กำลังสร้าง...' : 'สร้างรายการซื้อของ'}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center">🛒</div>
                <h2 className="font-semibold text-gray-900">รายการซื้อของ</h2>
                {generating && <span className="text-sm text-gray-500">กำลังสร้าง...</span>}
              </div>
              {Object.values(shopping).some(dayList => dayList.length > 0) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={printShoppingList}
                    className="inline-flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-lg shadow border border-emerald-200 hover:bg-emerald-50 transition-colors"
                    title="พิมพ์รายการ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="hidden sm:inline">พิมพ์</span>
                  </button>
                  <button
                    onClick={saveShoppingList}
                    className="inline-flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-lg shadow border border-emerald-200 hover:bg-emerald-50 transition-colors"
                    title="บันทึกรายการ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">บันทึก</span>
                  </button>
                </div>
              )}
            </div>
            {!Object.values(shopping).some(dayList => dayList.length > 0) ? (
              <div className="text-gray-500 text-sm">ยังไม่มีรายการ กดปุ่ม "สร้างรายการซื้อของ" เพื่อสร้าง</div>
            ) : (
              <div className="space-y-6">
                {DAYS.map(day => {
                  const dayList = shopping[day] || [];
                  if (dayList.length === 0) return null;
                  
                  const dayNames = {
                    'Sun': 'อาทิตย์',
                    'Mon': 'จันทร์',
                    'Tue': 'อังคาร',
                    'Wed': 'พุธ',
                    'Thu': 'พฤหัสบดี',
                    'Fri': 'ศุกร์',
                    'Sat': 'เสาร์'
                  };
                  
                  return (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg">วัน{dayNames[day]}</h3>
                      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-2">
                        {dayList.map((it, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <div>
                              <span className="font-medium text-gray-800">{it.name}</span>
                              {it.measure && <span className="text-gray-600"> — {it.measure}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </main>

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

      <ClearPlanModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearWeeklyPlan}
        loading={clearingPlan}
      />
    </div>
  );
}

export default WeeklyMealPlanPage;