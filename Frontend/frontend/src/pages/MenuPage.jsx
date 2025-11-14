import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import AddMenuModal from '../components/AddMenuModal';

const API_URL = 'http://localhost:3000/api';
const ALL_CATEGORY = 'ALL';
const UNCATEGORIZED = 'UNCATEGORIZED';

function formatDateThai(dateString) {
  if (!dateString) return 'ไม่ระบุ';
  try {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'ไม่ระบุ';
  }
}

function MenuCard({ menu, categoryName, token }) {
  const navigate = useNavigate();
  const imageSrc = menu.menu_image
    ? (menu.menu_image.startsWith('http') ? menu.menu_image : `http://localhost:3000/images/${menu.menu_image}`)
    : 'https://via.placeholder.com/400x260.png?text=MealVault';
  const summary = menu.menu_description || menu.menu_recipe || 'ยังไม่มีคำอธิบายเมนูนี้';
  const [likeCount, setLikeCount] = useState(menu.menu_like_count || 0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    setLikeCount(menu.menu_like_count || 0);
    setLiked(false);
  }, [menu.menu_id, menu.menu_like_count]);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      if (!token) {
        setLiked(false);
        return;
      }
      try {
        const resp = await fetch(`${API_URL}/menus/${menu.menu_id}/likes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!cancelled) {
          setLikeCount(data.like_count ?? 0);
          setLiked(!!data.liked);
        }
      } catch (error) {
        console.error('Failed to fetch menu like status:', error);
      }
    };
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [token, menu.menu_id]);

  const handleToggleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      alert('กรุณาเข้าสู่ระบบเพื่อกดไลค์เมนู');
      return;
    }
    if (likeLoading) return;

    setLikeLoading(true);
    try {
      const resp = await fetch(`${API_URL}/menus/${menu.menu_id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'ไม่สามารถกดไลค์เมนูได้');
      setLikeCount(data.like_count ?? 0);
      setLiked(!!data.liked);
    } catch (error) {
      alert(error.message || 'เกิดข้อผิดพลาดในการกดไลค์เมนู');
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <div className="group bg-white rounded-[1.75rem] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageSrc}
          alt={menu.menu_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/90 text-emerald-700 shadow">
            {categoryName || 'หมวดหมู่ทั่วไป'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggleLike}
          disabled={likeLoading}
          className={`absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full font-semibold shadow transition ${
            liked ? 'bg-rose-600 text-white' : 'bg-white/90 text-rose-500'
          } ${likeLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white'}`}
        >
          <svg
            className={`w-4 h-4 ${liked ? 'fill-current' : ''}`}
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 21s-5.434-4.45-8.152-7.168C1.97 11.954 1 10.329 1 8.5 1 5.995 2.995 4 5.5 4c1.57 0 3.057.874 3.862 2.253C10.443 4.874 11.93 4 13.5 4 16.005 4 18 5.995 18 8.5c0 1.83-.97 3.454-2.848 5.332C17.434 16.55 12 21 12 21z" />
          </svg>
          {likeCount}
        </button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-semibold drop-shadow-md line-clamp-1">{menu.menu_name}</h3>
          <p className="text-sm text-white/80 line-clamp-2">{summary}</p>
        </div>
      </div>
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center text-xs text-gray-400 gap-2">
          <span>{formatDateThai(menu.menu_datetime)}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>สร้างโดย {menu.user_id ? `ID: ${menu.user_id}` : 'ระบบ'}</span>
        </div>
        {menu.menu_recipe && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-sm text-gray-600 line-clamp-3">
            {menu.menu_recipe}
          </div>
        )}
        <div className="mt-auto flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/menus/${menu.menu_id}`)}
            className="flex-1 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow"
          >
            ดูรายละเอียด
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/menus/${menu.menu_id}`;
              navigator.clipboard.writeText(url).then(() => {
                alert('คัดลอกลิงก์แล้ว!');
              }).catch(() => {
                alert('ไม่สามารถคัดลอกลิงก์ได้');
              });
            }}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:border-gray-300 hover:text-gray-800 transition-colors"
          >
            แชร์
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuPage() {
  const { token, user } = useContext(AuthContext);
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.category_id] = cat.category_name;
    });
    return map;
  }, [categories]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [menuResp, categoryResp] = await Promise.all([
          fetch(`${API_URL}/menus`),
          fetch(`${API_URL}/categories`)
        ]);

        if (!menuResp.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลเมนูได้');
        }
        if (!categoryResp.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
        }

        const menuData = await menuResp.json();
        const categoryData = await categoryResp.json();

        setMenus(Array.isArray(menuData) ? menuData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddMenuSuccess = () => {
    // Refresh menu list after successful addition
    const fetchData = async () => {
      try {
        const menuResp = await fetch(`${API_URL}/menus`);
        if (menuResp.ok) {
          const menuData = await menuResp.json();
          setMenus(Array.isArray(menuData) ? menuData : []);
        }
      } catch (err) {
        console.error('Error refreshing menus:', err);
      }
    };
    fetchData();
  };

  const filteredMenus = useMemo(() => {
    let filtered = [...menus];
    if (searchTerm.trim()) {
      filtered = filtered.filter((menu) =>
        menu.menu_name && menu.menu_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeCategory !== ALL_CATEGORY) {
      if (activeCategory === UNCATEGORIZED) {
        filtered = filtered.filter((menu) => !menu.category_id);
      } else {
        filtered = filtered.filter((menu) => menu.category_id === activeCategory);
      }
    }
    return filtered;
  }, [menus, searchTerm, activeCategory]);

  const groupedMenus = useMemo(() => {
    const map = new Map();
    filteredMenus.forEach((menu) => {
      const key = menu.category_id || UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(menu);
    });
    return map;
  }, [filteredMenus]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">เมนูจากฐานข้อมูล</h1>
              <p className="text-sm text-gray-500 mt-1">เลือกหมวดหมู่หรือค้นหาเมนูที่คุณต้องการ</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="ค้นหาจากชื่อเมนู..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {user?.isAdmin && (
                <button
                  onClick={() => setIsAddMenuModalOpen(true)}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มเมนู
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setActiveCategory(ALL_CATEGORY)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === ALL_CATEGORY
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              ทั้งหมด ({menus.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.category_id}
                onClick={() => setActiveCategory(category.category_id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeCategory === category.category_id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {category.category_name}
                {groupedMenus.has(category.category_id) && (
                  <span className="ml-2 text-xs opacity-80">
                    ({groupedMenus.get(category.category_id).length})
                  </span>
                )}
              </button>
            ))}
            {groupedMenus.has(UNCATEGORIZED) && (
              <button
                onClick={() => setActiveCategory(UNCATEGORIZED)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeCategory === UNCATEGORIZED
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                หมวดหมู่ทั่วไป ({groupedMenus.get(UNCATEGORIZED).length})
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-16 text-gray-500">กำลังโหลดข้อมูลเมนู...</div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : filteredMenus.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-gray-500 mb-4">
                {searchTerm ? 'ไม่พบเมนูที่ค้นหา' : 'ยังไม่มีเมนูในหมวดหมู่นี้'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-400">
                  กรุณาเพิ่มเมนูผ่านระบบหลังบ้าน แล้วลองอีกครั้ง
                </p>
              )}
            </div>
          ) : activeCategory !== ALL_CATEGORY ? (
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">
                  {activeCategory === UNCATEGORIZED
                    ? 'หมวดหมู่ทั่วไป'
                    : categoryMap[activeCategory] || 'หมวดหมู่'}
                </h2>
                <p className="text-sm text-gray-500">{filteredMenus.length} เมนู</p>
              </div>
              <div className="px-5 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMenus.map((menu) => (
                    <MenuCard
                      key={menu.menu_id}
                      menu={menu}
                      categoryName={
                        activeCategory === UNCATEGORIZED
                          ? 'หมวดหมู่ทั่วไป'
                          : categoryMap[activeCategory] || 'หมวดหมู่'
                      }
                      token={token}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">เมนูทั้งหมด</h2>
                <p className="text-sm text-gray-500">{filteredMenus.length} เมนู</p>
              </div>
              <div className="px-5 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMenus.map((menu) => (
                    <MenuCard
                      key={menu.menu_id}
                      menu={menu}
                      categoryName={categoryMap[menu.category_id] || 'หมวดหมู่ทั่วไป'}
                      token={token}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AddMenuModal
        isOpen={isAddMenuModalOpen}
        onClose={() => setIsAddMenuModalOpen(false)}
        onSuccess={handleAddMenuSuccess}
        token={token}
        categories={categories}
      />
    </div>
  );
}

export default MenuPage;