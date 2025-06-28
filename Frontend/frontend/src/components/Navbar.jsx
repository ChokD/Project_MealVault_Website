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
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/chatbot" className="text-gray-700 hover:text-green-600 transition-colors">AI Chat Bot</Link>
          <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors">หน้าหลัก</Link>
          <Link to="/menus" className="text-gray-700 hover:text-green-600 transition-colors">เมนูอาหาร</Link>
          <Link to="/community" className="text-gray-700 hover:text-green-600 transition-colors">ชุมชน</Link>
          
          {/* แก้ไขลิงก์ About Us */}
          <Link to="/about" className="text-gray-700 hover:text-green-600 transition-colors">About Us</Link>
          
          {token ? (
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
            <Link to="/login" className="px-4 py-2 border border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition-colors duration-300">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;