import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';

function ProfilePage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    user_fname: '',
    user_lname: '',
    user_tel: '',
  });
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลผู้ใช้ปัจจุบันมาแสดงตอนเปิดหน้า
  useEffect(() => {
    // ใช้ข้อมูลจาก Context ที่มีอยู่แล้ว ไม่ต้อง fetch ใหม่
    if (user) {
      setFormData({
        user_fname: user.user_fname || '',
        user_lname: user.user_lname || '',
        user_tel: user.user_tel || '',
      });
      setLoading(false);
    } else if (!token) {
      // ถ้าไม่มี token เลย ให้ไปหน้า login
      navigate('/login');
    }
  }, [user, token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
      
      // แสดง Animation และตั้งเวลาเพื่อกลับไปหน้าหลัก
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>กำลังโหลดข้อมูลผู้ใช้...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24">
        <div className="w-full bg-white rounded-xl shadow-lg sm:max-w-md p-8 space-y-6">
          
          {showSuccess ? (
            <SuccessAnimation message="บันทึกข้อมูลสำเร็จ!" />
          ) : (
            <>
              <h1 className="text-xl font-bold text-center">แก้ไขข้อมูลส่วนตัว</h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- ส่วนของฟอร์มที่เพิ่มเข้ามา --- */}
                <div>
                  <label htmlFor="user_fname" className="block mb-2 text-sm font-medium text-gray-900">ชื่อจริง</label>
                  <input
                    type="text"
                    name="user_fname"
                    id="user_fname"
                    value={formData.user_fname}
                    onChange={handleChange}
                    className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="user_lname" className="block mb-2 text-sm font-medium text-gray-900">นามสกุล</label>
                  <input
                    type="text"
                    name="user_lname"
                    id="user_lname"
                    value={formData.user_lname}
                    onChange={handleChange}
                    className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="user_tel" className="block mb-2 text-sm font-medium text-gray-900">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    name="user_tel"
                    id="user_tel"
                    value={formData.user_tel}
                    onChange={handleChange}
                    className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                  />
                </div>
                {/* --- จบส่วนของฟอร์ม --- */}

                <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                  บันทึกการเปลี่ยนแปลง
                </button>
                {message && <p className="text-center text-sm text-red-600 mt-4">{message}</p>}
              </form>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default ProfilePage;