import React, { useState, useEffect } from 'react';
import { API_URL, IMAGE_URL } from '../config/api';

function AddMenuModal({ isOpen, onClose, onSuccess, token, categories }) {
  const [formData, setFormData] = useState({
    menu_name: '',
    menu_description: '',
    menu_recipe: '',
    menu_image: '',
    category_id: '',
    menu_source: '',
    menu_source_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        menu_name: '',
        menu_description: '',
        menu_recipe: '',
        menu_image: '',
        category_id: '',
        menu_source: '',
        menu_source_url: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!formData.menu_name.trim() || !formData.menu_description.trim() || !formData.menu_recipe.trim()) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อเมนู, คำอธิบาย, วิธีทำ)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          menu_name: formData.menu_name.trim(),
          menu_description: formData.menu_description.trim(),
          menu_recipe: formData.menu_recipe.trim(),
          menu_image: formData.menu_image.trim() || undefined,
          category_id: formData.category_id || undefined,
          menu_source: formData.menu_source.trim() || undefined,
          menu_source_url: formData.menu_source_url.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการเพิ่มเมนู');
      }

      // Success - close modal and refresh menu list
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเพิ่มเมนู');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">เพิ่มเมนูใหม่</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="menu_name" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อเมนู <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="menu_name"
              name="menu_name"
              value={formData.menu_name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="เช่น ข้าวผัดกุ้ง"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="menu_description" className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบายเมนู <span className="text-red-500">*</span>
            </label>
            <textarea
              id="menu_description"
              name="menu_description"
              value={formData.menu_description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              placeholder="อธิบายเกี่ยวกับเมนูนี้..."
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="menu_recipe" className="block text-sm font-medium text-gray-700 mb-2">
              วิธีทำ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="menu_recipe"
              name="menu_recipe"
              value={formData.menu_recipe}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              placeholder="ขั้นตอนการทำอาหาร..."
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              disabled={loading}
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="menu_image" className="block text-sm font-medium text-gray-700 mb-2">
              รูปภาพ (URL)
            </label>
            <input
              type="text"
              id="menu_image"
              name="menu_image"
              value={formData.menu_image}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="https://example.com/image.jpg หรือชื่อไฟล์ในระบบ"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              ใส่ URL ของรูปภาพ หรือชื่อไฟล์รูปภาพที่อัปโหลดไว้แล้ว
            </p>
          </div>

          <div>
            <label htmlFor="menu_source" className="block text-sm font-medium text-gray-700 mb-2">
              แหล่งอ้างอิง (ที่มา)
            </label>
            <input
              type="text"
              id="menu_source"
              name="menu_source"
              value={formData.menu_source}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="เช่น ตำรับอาหาร - เตื้อง สนิทวงศ์, ม.ร.ว., 2426-2510"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="menu_source_url" className="block text-sm font-medium text-gray-700 mb-2">
              ลิงก์แหล่งอ้างอิง (URL)
            </label>
            <input
              type="url"
              id="menu_source_url"
              name="menu_source_url"
              value={formData.menu_source_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="https://example.com/source"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังเพิ่ม...
                </>
              ) : (
                'เพิ่มเมนู'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMenuModal;

