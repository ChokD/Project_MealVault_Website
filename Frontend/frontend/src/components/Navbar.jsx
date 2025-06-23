import React from 'react';
import { Link } from 'react-router-dom'; // นำเข้า Link สำหรับการเปลี่ยนหน้า
import './Navbar.css'; 

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">MealVault</div>
      <div className="navbar-links">
        <a href="#">AI Chat Bot</a>
        <a href="#">หน้าหลัก</a>
        <a href="#">เมนูอาหาร</a>
        <a href="#">ชุมชน</a>
        <a href="#">About Us</a>
        <Link to="/login" className="login-button">เข้าสู่ระบบ</Link>
      </div>
    </nav>
  );
}

export default Navbar;