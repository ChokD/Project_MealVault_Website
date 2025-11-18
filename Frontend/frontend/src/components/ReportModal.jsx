import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function ReportModal({ isOpen, onClose, cpostId, commentId, recipeId, onReportSubmitted }) {
  const { token } = useContext(AuthContext);
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ดึงรายการประเภทการรายงาน
  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/reports/types');
        if (!response.ok) throw new Error('Failed to fetch report types');
        const data = await response.json();
        setReportTypes(data);
      } catch (error) {
        console.error('Error fetching report types:', error);
        // Fallback: ใช้รายการประเภทการรายงานแบบ hardcode
        setReportTypes([
          { value: 'inappropriate_language', label: 'ใช้ภาษาไม่เหมาะสม' },
          { value: 'false_information', label: 'เผยแพร่ข้อมูลที่เป็นเท็จ' },
          { value: 'copyright_violation', label: 'การละเมิดลิขสิทธิ์' },
          { value: 'spam', label: 'สแปมหรือโฆษณา' },
          { value: 'harassment', label: 'การกลั่นแกล้งหรือข่มขู่' },
          { value: 'other', label: 'อื่นๆ' }
        ]);
      }
    };

    if (isOpen) {
      fetchReportTypes();
      setSelectedType('');
      setDetails('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedType) {
      setError('กรุณาเลือกประเภทการรายงาน');
      return;
    }

    if (!token) {
      setError('กรุณาเข้าสู่ระบบเพื่อรายงาน');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cpost_id: cpostId || null,
          comment_id: commentId || null,
          recipe_id: recipeId || null,
          creport_type: selectedType,
          creport_details: details.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onReportSubmitted) {
          onReportSubmitted();
        }
        setSuccess(false);
        setSelectedType('');
        setDetails('');
      }, 1500);

    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {recipeId ? 'รายงานสูตรอาหาร' : cpostId ? 'รายงานโพสต์' : 'รายงานคอมเมนต์'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-green-600 font-semibold">ส่งรายงานสำเร็จ</p>
            <p className="text-gray-600 text-sm mt-2">ขอบคุณสำหรับการรายงาน</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                ประเภทการรายงาน <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">เลือกประเภทการรายงาน</option>
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="กรุณาระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportModal;

