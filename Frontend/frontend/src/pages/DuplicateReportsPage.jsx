import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

function DuplicateReportsPage() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user?.isAdmin) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }
    fetchReports();
  }, [user, navigate, filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? `${API_URL}/duplicate-reports`
        : `${API_URL}/duplicate-reports?status=${filter}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดรายงานได้');
      }

      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/duplicate-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'ไม่สามารถอัปเดตได้');
      }

      alert('อัปเดตสถานะสำเร็จ');
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports(); // Reload data
    } catch (error) {
      console.error('Update failed:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      resolved: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      pending: 'รอตรวจสอบ',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      resolved: 'แก้ไขแล้ว'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getSimilarityColor = (score) => {
    if (score >= 70) return 'text-red-600 font-bold';
    if (score >= 50) return 'text-yellow-600 font-semibold';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-6 sm:px-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">รายงานสูตรซ้ำ</h1>
            <p className="text-gray-600">ตรวจสอบและจัดการรายงานสูตรอาหารที่ถูกรายงานว่าซ้ำกัน</p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            {[
              { value: 'pending', label: 'รอตรวจสอบ' },
              { value: 'approved', label: 'อนุมัติ' },
              { value: 'rejected', label: 'ปฏิเสธ' },
              { value: 'resolved', label: 'แก้ไขแล้ว' },
              { value: 'all', label: 'ทั้งหมด' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  filter === tab.value
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">กำลังโหลดรายงาน...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">ไม่พบรายงานในหมวดนี้</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            รายงานที่ #{report.id.slice(0, 8)}
                          </h3>
                          {getStatusBadge(report.status)}
                          <span className={`text-sm ${getSimilarityColor(report.similarity_score)}`}>
                            {report.similarity_score}% คล้าย
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          รายงานโดย: {report.reporter_name || 'ไม่ระบุ'} • 
                          {new Date(report.reported_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Side by side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Original Recipe */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900">สูตรต้นฉบับ</h4>
                        </div>
                        <h5 className="text-base font-medium text-gray-800 mb-2">
                          {report.original_recipe_title}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2">
                          โดย: {report.original_creator_name}
                        </p>
                        <button
                          onClick={() => navigate(`/menus/${report.original_recipe_id}`)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          ดูสูตรเต็ม →
                        </button>
                      </div>

                      {/* Suspected Recipe */}
                      <div className="border border-gray-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <h4 className="font-semibold text-gray-900">สูตรที่ถูกรายงาน</h4>
                        </div>
                        <h5 className="text-base font-medium text-gray-800 mb-2">
                          {report.suspected_recipe_title}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2">
                          โดย: {report.suspected_creator_name}
                        </p>
                        <button
                          onClick={() => navigate(`/menus/${report.suspected_recipe_id}`)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          ดูสูตรเต็ม →
                        </button>
                      </div>
                    </div>

                    {/* Match Type */}
                    {report.match_type && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>ประเภทความคล้าย:</strong> {
                            report.match_type === 'title' ? 'ชื่อคล้ายกัน' :
                            report.match_type === 'ingredients' ? 'วัตถุดิบคล้ายกัน' :
                            report.match_type === 'steps' ? 'ขั้นตอนคล้ายกัน' :
                            report.match_type === 'combined' ? 'คล้ายกันหลายด้าน' :
                            report.match_type
                          }
                        </p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {report.admin_notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>บันทึกของ Admin:</strong> {report.admin_notes}
                        </p>
                        {report.reviewed_by && (
                          <p className="text-xs text-gray-500 mt-1">
                            โดย: {report.reviewed_by} • {new Date(report.reviewed_at).toLocaleDateString('th-TH')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {report.status === 'pending' && (
                      <div className="border-t border-gray-200 pt-4">
                        {selectedReport?.id === report.id ? (
                          <div className="space-y-3">
                            <textarea
                              placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              rows="2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStatus(report.id, 'approved')}
                                disabled={updating}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                ✓ อนุมัติ (ซ้ำจริง)
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(report.id, 'rejected')}
                                disabled={updating}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                ✗ ปฏิเสธ (ไม่ซ้ำ)
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                disabled={updating}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                ✓ แก้ไขแล้ว
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReport(null);
                                  setAdminNotes('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            ดำเนินการ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DuplicateReportsPage;
