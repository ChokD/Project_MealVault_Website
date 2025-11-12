import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SuccessAnimation from '../components/SuccessAnimation'; // 1. นำเข้า Component Animation

function SignUpPage() {
  const [formData, setFormData] = useState({
    user_email: '',
    user_password: '',
    user_fname: '',
    user_lname: '',
    user_tel: '',
    allergies: '',
    favorite_foods: '',
  });
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false); // 2. เพิ่ม State สำหรับควบคุม Animation
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  // ตรวจสอบว่าผู้ใช้ยอมรับ Terms แล้วหรือไม่
  useEffect(() => {
    const accepted = localStorage.getItem('termsAccepted') === 'true';
    if (!accepted) {
      // เก็บข้อมูลว่ามาจากหน้า register
      sessionStorage.setItem('fromRegister', 'true');
      navigate('/terms');
    } else {
      setTermsAccepted(true);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    // ตรวจสอบว่ายอมรับ Terms แล้วหรือไม่
    if (!termsAccepted) {
      setError('กรุณายอมรับข้อกำหนดและเงื่อนไขการใช้งานก่อนสมัครสมาชิก');
      navigate('/terms');
      return;
    }

    try {
      // Process allergies and favorite_foods - convert to comma-separated strings if provided
      const submitData = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.trim() : null,
        favorite_foods: formData.favorite_foods ? formData.favorite_foods.trim() : null,
      };

      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }

      // 3. แก้ไขส่วนนี้: แสดง Animation แล้วค่อยเปลี่ยนหน้า
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000); // หน่วงเวลา 2 วินาที

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-white flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl animate-pulse delay-75"></div>
      </div>
      
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24 relative z-10">
        <div className="w-full bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl sm:max-w-md border border-emerald-100 max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            
            {/* 4. เพิ่มเงื่อนไขการแสดงผล */}
            {showSuccess ? (
              <SuccessAnimation message="สมัครสมาชิกสำเร็จ!" />
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent md:text-4xl">
                    สร้างบัญชีใหม่
                  </h1>
                  <p className="text-gray-500 mt-2">เริ่มต้นการเดินทางของคุณ</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  {/* ... โค้ดของฟอร์มทั้งหมดเหมือนเดิม ... */}
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label htmlFor="user_fname" className="block mb-2 text-sm font-medium text-gray-900">ชื่อจริง</label>
                      <input type="text" name="user_fname" id="user_fname" onChange={handleChange} className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" required />
                    </div>
                    <div className="w-1/2">
                      <label htmlFor="user_lname" className="block mb-2 text-sm font-medium text-gray-900">นามสกุล</label>
                      <input type="text" name="user_lname" id="user_lname" onChange={handleChange} className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="user_email" className="block mb-2 text-sm font-medium text-gray-900">อีเมล</label>
                    <input type="email" name="user_email" id="user_email" onChange={handleChange} className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" required />
                  </div>
                  <div>
                    <label htmlFor="user_password" className="block mb-2 text-sm font-medium text-gray-900">รหัสผ่าน</label>
                    <input type="password" name="user_password" id="user_password" onChange={handleChange} className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" required />
                  </div>
                  <div>
                    <label htmlFor="user_tel" className="block mb-2 text-sm font-medium text-gray-900">เบอร์โทรศัพท์ <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input type="tel" name="user_tel" id="user_tel" onChange={handleChange} className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" />
                  </div>
                  <div>
                    <label htmlFor="allergies" className="block mb-2 text-sm font-medium text-gray-900">แพ้อาหาร <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input 
                      type="text" 
                      name="allergies" 
                      id="allergies" 
                      value={formData.allergies}
                      onChange={handleChange} 
                      className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" 
                      placeholder="เช่น ถั่ว, นม, กุ้ง (คั่นด้วยเครื่องหมายจุลภาค)"
                    />
                    <p className="mt-1 text-xs text-gray-500">กรอกอาหารที่แพ้โดยคั่นด้วยเครื่องหมายจุลภาค (เช่น ถั่ว, นม, กุ้ง)</p>
                  </div>
                  <div>
                    <label htmlFor="favorite_foods" className="block mb-2 text-sm font-medium text-gray-900">อาหารที่ชอบ <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input 
                      type="text" 
                      name="favorite_foods" 
                      id="favorite_foods" 
                      value={formData.favorite_foods}
                      onChange={handleChange} 
                      className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" 
                      placeholder="เช่น ข้าวผัด, ต้มยำ, ผัดไทย (คั่นด้วยเครื่องหมายจุลภาค)"
                    />
                    <p className="mt-1 text-xs text-gray-500">กรอกอาหารที่ชอบโดยคั่นด้วยเครื่องหมายจุลภาค (เช่น ข้าวผัด, ต้มยำ, ผัดไทย)</p>
                  </div>
                  
                  {/* Terms Acceptance Checkbox */}
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                    <label className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            localStorage.removeItem('termsAccepted');
                            navigate('/terms');
                          }
                        }}
                        className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                        required
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                        <span className="font-semibold">ฉันยอมรับข้อกำหนดและเงื่อนไขการใช้งาน</span>
                        <span className="block text-xs text-gray-600 mt-1">
                          รวมถึงข้อกำหนดการใช้งานเว็บไซต์ กฎข้อบังคับการใช้งานชุมชน และนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                        </span>
                        <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
                          อ่านรายละเอียดเพิ่มเติม
                        </Link>
                      </span>
                    </label>
                  </div>

                  {error && <p className="text-sm text-center text-red-500">{error}</p>}
                  <button 
                    type="submit" 
                    disabled={!termsAccepted}
                    className={`w-full text-white font-bold rounded-xl text-lg px-5 py-3.5 text-center transition-all duration-300 transform shadow-lg ${
                      termsAccepted
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 focus:ring-4 focus:outline-none focus:ring-emerald-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    สมัครสมาชิก
                  </button>
                  <p className="text-sm font-light text-center text-gray-500">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Link to="/login" className="font-medium text-green-600 hover:underline">
                      เข้าสู่ระบบที่นี่
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignUpPage;