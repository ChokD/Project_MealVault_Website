import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:3000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-md p-8 space-y-6">
          <h1 className="text-xl font-bold text-center">ลืมรหัสผ่าน</h1>
          <p className="text-center text-sm text-gray-600">กรุณากรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่</p>

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">อีเมล</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                  required
                />
              </div>
              <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                ส่งลิงก์
              </button>
            </form>
          ) : (
            <p className="text-center text-green-700 font-semibold">{message}</p>
          )}

          <p className="text-sm text-center">
            <Link to="/login" className="font-medium text-green-600 hover:underline">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;