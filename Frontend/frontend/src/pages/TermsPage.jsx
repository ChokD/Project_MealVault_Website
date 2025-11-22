import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TermsContent from '../components/TermsContent';

function TermsPage() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleAccept = () => {
    if (accepted) {
      // เก็บสถานะการยอมรับใน localStorage
      localStorage.setItem('termsAccepted', 'true');
      // ไปหน้า register โดยอัตโนมัติ
      navigate('/register');
    }
  };

  // ตรวจสอบว่าผู้ใช้มาจากหน้า register หรือไม่
  useEffect(() => {
    const fromRegister = sessionStorage.getItem('fromRegister');
    if (!fromRegister) {
      // ถ้าไม่ได้มาจากหน้า register ให้เก็บข้อมูลไว้
      sessionStorage.setItem('fromRegister', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-white flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl animate-pulse delay-75"></div>
      </div>
      
      <Navbar />
      <main className="flex-grow p-4 pt-24 pb-8 relative z-10">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-emerald-100">
          <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                ข้อกำหนดและเงื่อนไขการใช้งาน
              </h1>
              <p className="text-gray-600">Terms of Service, Community Guidelines & Privacy Policy</p>
              <p className="text-sm text-gray-500 mt-2">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Terms Content */}
            <div className="max-h-[60vh] overflow-y-auto pr-2 mb-8 terms-scrollbar">
              <TermsContent />
            </div>

            {/* Acceptance Section */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-gray-900">
                    <span className="font-semibold">ฉันได้อ่านและยอมรับข้อกำหนดและเงื่อนไขการใช้งานทั้งหมด</span>
                    <span className="block text-sm text-gray-600 mt-1">
                      รวมถึงข้อกำหนดการใช้งานเว็บไซต์ กฎข้อบังคับการใช้งานชุมชน และนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ที่ระบุไว้ข้างต้น
                    </span>
                  </span>
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleAccept}
                  disabled={!accepted}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                    accepted
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:scale-[1.02] hover:shadow-xl cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ยืนยันและดำเนินการต่อ
                </button>
                <Link
                  to="/"
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-lg text-center border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                >
                  ยกเลิก
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

export default TermsPage;

