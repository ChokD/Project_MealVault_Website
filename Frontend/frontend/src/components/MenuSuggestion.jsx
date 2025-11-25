import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, IMAGE_URL } from '../config/api';

function ChipInput({ label, placeholder, values, setValues }) {
  const [input, setInput] = useState('');

  const addValue = () => {
    const parts = input.split(',').map(v => v.trim()).filter(Boolean);
    if (parts.length === 0) return;
    const next = Array.from(new Set([...values, ...parts]));
    setValues(next);
    setInput('');
  };

  const removeAt = (idx) => {
    setValues(values.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2 mb-2 flex-wrap">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {v}
            <button onClick={() => removeAt(i)} className="text-emerald-700/80 hover:text-emerald-900">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button onClick={addValue} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">เพิ่ม</button>
      </div>
      <p className="text-xs text-gray-500 mt-1">พิมพ์หลายรายการคั่นด้วยเครื่องหมายจุลภาค (,)</p>
    </div>
  );
}

function MenuSuggestion() {
  const navigate = useNavigate();
  const [likes, setLikes] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const handleSuggest = async () => {
    setError('');
    setResults([]);
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/menus/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likes, allergies })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'ขอคำแนะนำไม่สำเร็จ');
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8">
      <h2 className="text-3xl font-bold mb-6 text-center md:text-left">ผู้ช่วยเลือกเมนูอัตโนมัติ</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1 bg-white rounded-xl p-5 shadow-lg border border-gray-100">
          <div className="space-y-5">
            <div>
              <ChipInput
                label="คุณแพ้วัตถุดิบอะไรบ้าง?"
                placeholder="เช่น กุ้ง, ถั่วลิสง"
                values={allergies}
                setValues={setAllergies}
              />
            </div>
            <div>
              <ChipInput
                label="อยากให้มีวัตถุดิบอะไรในเมนู?"
                placeholder="เช่น ไก่, ไข่, โหระพา"
                values={likes}
                setValues={setLikes}
              />
            </div>
            <button
              onClick={handleSuggest}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'กำลังประมวลผล...' : 'ขอคำแนะนำ 3 เมนู'}
            </button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        </div>

        <div className="md:col-span-2">
          {results.length === 0 ? (
            <div className="h-full min-h-[16rem] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-500 bg-white">เลือกวัตถุดิบแล้วกดปุ่มเพื่อรับคำแนะนำ</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(item => (
                <div 
                  key={item.menu_id} 
                  onClick={() => navigate(`/recipe/${item.menu_id}`)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative">
                    <img src={item.menu_image || 'https://via.placeholder.com/400x300?text=Menu'} alt={item.menu_name} className="w-full h-48 object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 truncate" title={item.menu_name}>{item.menu_name}</h3>
                    <div className="text-xs text-gray-500">แนะนำจากความชอบของคุณ</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MenuSuggestion;



