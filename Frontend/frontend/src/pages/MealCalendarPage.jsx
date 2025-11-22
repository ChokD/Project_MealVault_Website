import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { API_URL, IMAGE_URL } from '../config/api';

function MealCalendarPage() {
  const { token } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState({ date: '', meal_type: 'breakfast', title: '', calories: '', menu_id: '' });
  const [error, setError] = useState('');

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const resp = await fetch(`${API_URL}/meal-calendar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('โหลดข้อมูลล้มเหลว');
    }
  };

  useEffect(() => {
    if (token) fetchItems();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, calories: form.calories === '' ? null : Number(form.calories), menu_id: form.menu_id || null };
      const resp = await fetch(`${API_URL}/meal-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'สร้างล้มเหลว');
      setForm({ date: '', meal_type: 'breakfast', title: '', calories: '', menu_id: '' });
      fetchItems();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const resp = await fetch(`${API_URL}/meal-calendar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.message || 'ลบล้มเหลว');
      }
      fetchItems();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow p-4 pt-24 max-w-3xl w-full mx-auto">
        <h1 className="text-2xl font-bold mb-4">ปฏิทินเมนู</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}

        <div className="bg-white p-4 rounded-lg shadow mb-4 grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-sm">จาก</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm">ถึง</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <button onClick={fetchItems} className="md:col-span-1 bg-green-500 text-white rounded px-4 py-2">โหลด</button>
        </div>

        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-2">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border p-2 rounded" required />
          <select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} className="border p-2 rounded">
            <option value="breakfast">เช้า</option>
            <option value="lunch">กลางวัน</option>
            <option value="dinner">เย็น</option>
            <option value="snack">ของว่าง</option>
          </select>
          <input type="text" placeholder="ชื่อเมนู/โน้ต" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border p-2 rounded" />
          <input type="number" placeholder="แคลอรี่" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="border p-2 rounded" />
          <button type="submit" className="bg-green-500 text-white rounded px-4 py-2">เพิ่ม</button>
        </form>

        <div className="bg-white rounded-lg shadow divide-y">
          {items.map(it => (
            <div key={it.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">{it.date} • {it.meal_type}</div>
                <div className="font-medium">{it.title || '(ไม่มีชื่อ)'}</div>
                {it.calories != null && <div className="text-sm">{it.calories} kcal</div>}
              </div>
              <button onClick={() => handleDelete(it.id)} className="text-red-600 hover:underline">ลบ</button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-6 text-center text-gray-500">ไม่มีรายการในช่วงวันที่เลือก</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MealCalendarPage;


