import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useContext(AuthContext);

  // ถ้าไม่มี Token ให้ส่งกลับไปหน้า Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี Token ให้แสดง Component ที่ถูกครอบอยู่
  return <Outlet />;
};

export default ProtectedRoute;