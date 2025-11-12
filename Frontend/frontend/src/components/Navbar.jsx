import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

function Navbar() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = user?.isAdmin || false;

  // กำหนดสีตามสถานะ Admin
  const primaryColor = isAdmin ? 'red' : 'green';
  const primaryGradient = isAdmin 
    ? 'from-red-500 to-red-600' 
    : 'from-green-500 to-emerald-500';
  const primaryHover = isAdmin 
    ? 'hover:text-red-600' 
    : 'hover:text-green-600';
  const primaryBg = isAdmin 
    ? 'bg-red-50 text-red-700 hover:bg-red-100' 
    : 'bg-green-50 text-green-700 hover:bg-green-100';
  const primaryBorder = isAdmin 
    ? 'border-red-100' 
    : 'border-green-100';
  const primaryTextGradient = isAdmin
    ? 'from-red-600 to-red-700'
    : 'from-green-600 to-emerald-600';

  return (
    <nav className={`fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md shadow-lg z-50 border-b ${primaryBorder}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className={`w-10 h-10 bg-gradient-to-br ${primaryGradient} rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
            <span className="text-white font-bold text-xl">🍽️</span>
          </div>
          <div className={`font-bold text-2xl bg-gradient-to-r ${primaryTextGradient} bg-clip-text text-transparent`}>
            MealVault {isAdmin && <span className="text-red-600">[Admin]</span>}
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/chatbot" className={`text-gray-700 ${primaryHover} transition-colors font-medium flex items-center space-x-1 group`}>
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>AI Chat Bot</span>
          </Link>
          <Link to="/" className={`text-gray-700 ${primaryHover} transition-colors font-medium`}>หน้าหลัก</Link>
          <Link to="/menus" className={`text-gray-700 ${primaryHover} transition-colors font-medium`}>เมนูอาหาร</Link>
          <Link to="/weekly-plan" className={`text-gray-700 ${primaryHover} transition-colors font-medium`}>วางแผนสัปดาห์</Link>
          <Link to="/community" className={`text-gray-700 ${primaryHover} transition-colors font-medium`}>ชุมชน</Link>
          <Link to="/about" className={`text-gray-700 ${primaryHover} transition-colors font-medium`}>About Us</Link>
          
          {token ? (
            <>
              <NotificationDropdown />
              <Link to="/profile" className={`px-4 py-2 ${primaryBg} font-semibold rounded-full transition-colors duration-300`}>
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
            <Link 
              to="/login" 
              className={`px-6 py-2 bg-gradient-to-r ${primaryGradient} text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isAdmin 
                  ? 'hover:from-red-600 hover:to-red-700' 
                  : 'hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

