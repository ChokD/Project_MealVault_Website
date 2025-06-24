import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage'; // 1. ตรวจสอบว่า import เข้ามาแล้ว

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 2. ตรวจสอบว่ามีบรรทัดนี้อยู่ และ path สะกดถูกต้อง */}
        <Route path="/register" element={<SignUpPage />} /> 

      </Routes>
    </Router>
  );
}

export default App;