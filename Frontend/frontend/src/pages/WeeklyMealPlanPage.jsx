import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

const STORAGE_KEY = 'weeklyMealPlan';

function loadPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyPlan();
    const parsed = JSON.parse(raw);
    return normalizePlan(parsed);
  } catch {
    return createEmptyPlan();
  }
}

function savePlan(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

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

function normalizePlan(value) {
  const base = createEmptyPlan();
  for (const day of DAYS) {
    for (const meal of MEALS) {
      base[day][meal] = Array.isArray(value?.[day]?.[meal]) ? value[day][meal] : [];
    }
  }
  return base;
}

async function fetchRecipeByName(query) {
  const resp = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
  const data = await resp.json();
  return data.meals || [];
}

async function fetchRecipeById(id) {
  const resp = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await resp.json();
  return data.meals && data.meals[0] ? data.meals[0] : null;
}

function parseIngredients(recipe) {
  const items = [];
  if (!recipe) return items;
  for (let i = 1; i <= 20; i++) {
    const name = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (name && String(name).trim() !== '') {
      items.push({ name: name.trim(), measure: (measure || '').trim() });
    }
  }
  return items;
}

function WeeklyMealPlanPage() {
  const [plan, setPlan] = useState(createEmptyPlan());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState({ day: null, meal: null });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [shopping, setShopping] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setPlan(loadPlan());
  }, []);

  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  const openAddModal = (day, meal) => {
    setModalTarget({ day, meal });
    setSearch('');
    setResults([]);
    setIsModalOpen(true);
  };

  const addRecipeToTarget = (recipe) => {
    if (!modalTarget.day || !modalTarget.meal) return;
    setPlan(prev => {
      const next = { ...prev, [modalTarget.day]: { ...prev[modalTarget.day] } };
      const list = [...next[modalTarget.day][modalTarget.meal]];
      const item = { id: recipe.idMeal, name: recipe.strMeal, thumb: recipe.strMealThumb };
      // avoid duplicates in same slot
      if (!list.some(r => r.id === item.id)) list.push(item);
      next[modalTarget.day][modalTarget.meal] = list;
      return next;
    });
    setIsModalOpen(false);
  };

  const removeRecipe = (day, meal, id) => {
    setPlan(prev => {
      const next = { ...prev, [day]: { ...prev[day] } };
      next[day][meal] = prev[day][meal].filter(r => r.id !== id);
      return next;
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoadingSearch(true);
    try {
      const meals = await fetchRecipeByName(search.trim());
      setResults(meals);
    } finally {
      setLoadingSearch(false);
    }
  };

  const allRecipeIds = useMemo(() => {
    const ids = [];
    for (const day of DAYS) {
      for (const meal of MEALS) {
        for (const r of plan[day][meal]) ids.push(r.id);
      }
    }
    return Array.from(new Set(ids));
  }, [plan]);

  const generateShoppingList = async () => {
    setGenerating(true);
    try {
      const recipes = await Promise.all(allRecipeIds.map(id => fetchRecipeById(id)));
      const all = recipes.flatMap(parseIngredients);
      const map = new Map();
      for (const { name, measure } of all) {
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, { name, measures: [] });
        if (measure) map.get(key).measures.push(measure);
      }
      // Combine measures as simple joined text (unit math can be complex; keep simple)
      const list = Array.from(map.values()).map(it => ({
        name: it.name,
        measure: it.measures.filter(Boolean).join(' + ')
      })).sort((a, b) => a.name.localeCompare(b.name));
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
            <button onClick={generateShoppingList} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
              สร้างรายการของซื้อ
            </button>
          </div>

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
                        <div key={r.id} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                          <img src={r.thumb} alt="" className="w-10 h-10 object-cover rounded" />
                          <div className="text-sm flex-1 truncate" title={r.name}>{r.name}</div>
                          <button onClick={() => removeRecipe(day, meal, r.id)} className="text-red-600 text-xs hover:underline">ลบ</button>
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
              {results.map(rec => (
                <div key={rec.idMeal} className="p-2 flex items-center gap-3">
                  <img src={rec.strMealThumb} alt="" className="w-14 h-14 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{rec.strMeal}</div>
                    <div className="text-xs text-gray-500">{rec.strCategory} • {rec.strArea}</div>
                  </div>
                  <button onClick={() => addRecipeToTarget(rec)} className="text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1">เพิ่ม</button>
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