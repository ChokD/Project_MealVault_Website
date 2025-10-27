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
    <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-lg z-50 border-b border-green-100">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <span className="text-white font-bold text-xl">🍽️</span>
          </div>
          <div className="font-bold text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            MealVault
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/chatbot" className="text-gray-700 hover:text-green-600 transition-colors font-medium flex items-center space-x-1 group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>AI Chat Bot</span>
          </Link>
          <Link to="/" className="text-gray-700 hover:text-green-600 transition-colors font-medium">หน้าหลัก</Link>
          <Link to="/menus" className="text-gray-700 hover:text-green-600 transition-colors font-medium">เมนูอาหาร</Link>
          <Link to="/community" className="text-gray-700 hover:text-green-600 transition-colors font-medium">ชุมชน</Link>
          <Link to="/about" className="text-gray-700 hover:text-green-600 transition-colors font-medium">About Us</Link>
          
          {token ? (
            <>
              <Link to="/profile" className="px-4 py-2 bg-green-50 text-green-700 font-semibold rounded-full hover:bg-green-100 transition-colors duration-300">
                {user ? `👤 ${user.user_fname}` : 'กำลังโหลด...'}
              </Link>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 border-2 border-red-300 text-red-500 font-semibold rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-lg"
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link to="/login" className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
