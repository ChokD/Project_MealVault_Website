import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="font-bold text-2xl text-green-600">
          <Link to="/">MealVault</Link>
        </div>

        {/* เราจะย้าย div ที่ครอบลิงก์ทั้งหมดมาไว้นอกเงื่อนไข */}
        <div className="hidden md:flex items-center space-x-6">

          {/* ลิงก์เหล่านี้จะแสดงผลตลอดเวลา */}
          <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">AI Chat Bot</a>
          <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors">หน้าหลัก</Link>
          <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">เมนูอาหาร</a>
          <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">ชุมชน</a>
          <a href="#" className="text-gray-700 hover:text-green-600 transition-colors">About Us</a>

          {/* --- ส่วนที่เปลี่ยนไปตามสถานะ Login --- */}
          {token ? (
            // ถ้ามี Token (Login แล้ว)
            <>
              <Link to="/profile" className="text-gray-800 font-semibold hover:text-green-600">
              {user ? `สวัสดี, ${user.user_fname}` : 'กำลังโหลด...'}
              </Link>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-300"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            // ถ้าไม่มี Token (ยังไม่ Login)
            <Link to="/login" className="px-4 py-2 border border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-300">
              เข้าสู่ระบบ
            </Link>
          )}
          {/* ------------------------------------ */}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;