import React, { createContext, useState, useEffect } from 'react';
import { API_URL, IMAGE_URL } from '../config/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Invalid token');
          }
          const userData = await response.json();

          // --- เพิ่ม console.log ตรงนี้เพื่อดูข้อมูลที่ได้รับ ---
          console.log("--- USER DATA FROM /api/me ---");
          console.log(userData);
          console.log("---------------------------------");
          // ---------------------------------------------

          setUser(userData); // เก็บข้อมูล User ที่ได้มาใน State
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          logout();
        }
      } else {
        setUser(null);
      }
    };

    fetchUserData();
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null); 
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Invalid token');
        }
        const userData = await response.json();
        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        return null;
      }
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
