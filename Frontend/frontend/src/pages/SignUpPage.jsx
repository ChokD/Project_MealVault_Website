import React, { useState } from 'react';
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
  });
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false); // 2. เพิ่ม State สำหรับควบคุม Animation
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-md">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            
            {/* 4. เพิ่มเงื่อนไขการแสดงผล */}
            {showSuccess ? (
              <SuccessAnimation message="สมัครสมาชิกสำเร็จ!" />
            ) : (
              <>
                <h1 className="text-xl font-bold text-center text-gray-900 md:text-2xl">
                  สร้างบัญชีใหม่
                </h1>
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
                    <label htmlFor="user_tel" className="block mb-2 text-sm font-medium text-gray-900">เบอร์โทรศัพท์</label>
                    <input type="tel" name="user_tel" id="user_tel" onChange={handleChange} className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none" required />
                  </div>
                  {error && <p className="text-sm text-center text-red-500">{error}</p>}
                  <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center transition-colors duration-300">
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