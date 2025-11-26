import React, { useState, useEffect } from 'react';

function ReportDuplicateModal({ isOpen, onClose, onSubmit, suspectedRecipeId, token, API_URL }) {
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [selectedOriginal, setSelectedOriginal] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      fetchRecentRecipes();
    }
  }, [isOpen, token]);

  const fetchRecentRecipes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/recipes/recent?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('ไม่สามารถโหลดรายการสูตรได้');
      const data = await response.json();
      // Filter out the suspected recipe itself
      setRecentRecipes(data.filter(recipe => recipe.recipe_id !== suspectedRecipeId));
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOriginal) {
      setError('กรุณาเลือกสูตรต้นฉบับที่ถูกคัดลอก');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(selectedOriginal);
      onClose();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการรายงาน');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">รายงานสูตรซ้ำ</h3>
              <p className="text-sm text-gray-600 mt-1">เลือกสูตรต้นฉบับที่คุณคิดว่าถูกคัดลอก</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลดรายการสูตร...</div>
            ) : recentRecipes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ไม่พบสูตรอาหารอื่นในระบบ</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentRecipes.map((recipe) => (
                  <label
                    key={recipe.recipe_id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedOriginal === recipe.recipe_id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="original"
                      value={recipe.recipe_id}
                      checked={selectedOriginal === recipe.recipe_id}
                      onChange={(e) => setSelectedOriginal(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{recipe.recipe_title}</h4>
                      <p className="text-xs text-gray-600">โดย: {recipe.user_fname || 'ผู้ใช้'}</p>
                      {recipe.recipe_summary && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{recipe.recipe_summary}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedOriginal}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'กำลังรายงาน...' : 'รายงาน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDuplicateModal;
