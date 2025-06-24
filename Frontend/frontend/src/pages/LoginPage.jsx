import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

function LoginPage() {
  // --- ส่วนที่ขาดไป: การสร้าง State และ Navigate ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // -----------------------------------------

  const { login } = useContext(AuthContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      // --- ทำให้ fetch สมบูรณ์ ---
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: email,
          user_password: password,
        }),
      });
      // --------------------------

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }

      login(data.token);

      alert('เข้าสู่ระบบสำเร็จ!');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-md">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold text-center text-gray-900 md:text-2xl">
              เข้าสู่ระบบ
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">Username</label>
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
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                  required
                />
              </div>
              <div className="text-right text-sm">
                <a href="#" className="font-medium text-gray-500 hover:underline">
                  Forget Password?
                </a>
              </div>
              {error && (
                <p className="text-sm text-center text-red-500">{error}</p>
              )}
              <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center transition-colors duration-300">
                Login
              </button>
              <p className="text-sm font-light text-center text-gray-500">
                Don’t have an account yet?{' '}
                <Link to="/register" className="font-medium text-red-500 hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;