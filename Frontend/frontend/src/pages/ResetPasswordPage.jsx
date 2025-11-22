import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_URL } from '../config/api';

function ResetPasswordPage() {
  // useParams() ใช้สำหรับดึงค่า "token" มาจาก URL
  const { token } = useParams();
  const navigate = useNavigate();

  console.log('ResetPasswordPage rendered, token:', token);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      setMessage(data.message + ' กำลังนำคุณไปหน้า Login...');
      setTimeout(() => navigate('/login'), 3000); // หน่วงเวลา 3 วินาทีแล้วไปหน้า Login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-md p-8 space-y-6">
          <h1 className="text-xl font-bold text-center">ตั้งรหัสผ่านใหม่</h1>

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border-b-2 border-gray-300 w-full p-2.5 outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-50 border-b-2 border-gray-300 w-full p-2.5 outline-none"
                  required
                />
              </div>
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                บันทึกรหัสผ่านใหม่
              </button>
            </form>
          ) : (
            <p className="text-center text-green-700 font-semibold">{message}</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;