import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';

function LoginPage() {
  // --- ส่วนที่เพิ่มเข้ามา: State ที่จำเป็นสำหรับฟอร์ม ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // --------------------------------------------------

  const [showSuccess, setShowSuccess] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }

      login(data.token);
      setShowSuccess(true); // สั่งให้แสดง Animation

      // ตั้งเวลา 2 วินาที แล้วค่อยเปลี่ยนหน้าไปหน้าแรก
      setTimeout(() => {
        navigate('/');
      }, 2000); // 2000 milliseconds = 2 วินาที

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-pulse delay-75"></div>
      </div>
      
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24 relative z-10">
        <div className="w-full bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl sm:max-w-md border border-green-100">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">

            {/* --- ส่วนที่เพิ่มเข้ามา: เงื่อนไขการแสดงผล --- */}
            {showSuccess ? (
              // ถ้าโชว์ Animation
              <SuccessAnimation message="เข้าสู่ระบบสำเร็จ!" />
            ) : (
              // ถ้ายังไม่โชว์ (แสดงฟอร์มปกติ)
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent md:text-4xl">
                    เข้าสู่ระบบ
                  </h1>
                  <p className="text-gray-500 mt-2">ยินดีต้อนรับกลับมา!</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      อีเมล
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                      placeholder="กรุณากรอกอีเมล"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      รหัสผ่าน
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                      placeholder="กรุณากรอกรหัสผ่าน"
                      required
                    />
                  </div>
                  <div className="text-right text-sm">
                    <Link to="/forgot-password" className="font-medium text-gray-500 hover:underline">
                      Forget Password?
                    </Link>
                  </div>
                  {error && (
                    <p className="text-sm text-center text-red-500">{error}</p>
                  )}
                  <button type="submit" className="w-full text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:ring-4 focus:outline-none focus:ring-green-300 font-bold rounded-xl text-lg px-5 py-3.5 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg">
                    เข้าสู่ระบบ
                  </button>
                  <p className="text-sm font-light text-center text-gray-500">
                    Don’t have an account yet?{' '}
                    <Link to="/register" className="font-medium text-red-500 hover:underline">
                      Sign up
                    </Link>
                  </p>
                </form>
              </>
            )}
            {/* ------------------------------------ */}

          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;