import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null); // <-- 1. เพิ่ม State สำหรับเก็บข้อมูล User

  // 2. ใช้ useEffect เพื่อดึงข้อมูล User ทุกครั้งที่มี Token หรือ Token เปลี่ยนไป
  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            // ถ้า Token ไม่ถูกต้อง (เช่น หมดอายุ) ให้ทำการ Logout
            throw new Error('Invalid token');
          }
          const userData = await response.json();
          setUser(userData); // เก็บข้อมูล User ที่ได้มาใน State
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          logout(); // เคลียร์ Token ที่ใช้ไม่ได้ทิ้งไป
        }
      } else {
        setUser(null); // ถ้าไม่มี Token ก็ให้ข้อมูล User เป็น null
      }
    };

    fetchUserData();
  }, [token]); // <-- ให้ฟังก์ชันนี้ทำงานใหม่ทุกครั้งที่ค่า token เปลี่ยน

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null); // <-- 3. ตอน Logout ให้เคลียร์ข้อมูล User ด้วย
  };

  // 4. ส่ง user state ไปพร้อมกับ token และฟังก์ชันต่างๆ
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};