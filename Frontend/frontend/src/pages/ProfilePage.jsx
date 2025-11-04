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
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({ calorie_limit: '', allergensText: '' });

  // ดึงข้อมูลผู้ใช้ปัจจุบันมาแสดงตอนเปิดหน้า
  useEffect(() => {
    // ใช้ข้อมูลจาก Context ที่มีอยู่แล้ว ไม่ต้อง fetch ใหม่
    if (user) {
      setFormData({
        user_fname: user.user_fname || '',
        user_lname: user.user_lname || '',
        user_tel: user.user_tel || '',
      });
      // โหลด preferences จาก API
      const fetchPrefs = async () => {
        try {
          const resp = await fetch('http://localhost:3000/api/preferences', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await resp.json();
          const allergensText = Array.isArray(data.allergens) ? data.allergens.join(',') : '';
          setPrefs({
            calorie_limit: data.calorie_limit ?? '',
            allergensText,
          });
        } catch (_) {}
        setLoading(false);
      };
      fetchPrefs();
    } else if (!token) {
      // ถ้าไม่มี token เลย ให้ไปหน้า login
      navigate('/login');
    }
  }, [user, token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // ตรวจสอบว่ามีการกรอกรหัสผ่านหรือไม่
    const hasPasswordChange = passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword;
    
    if (hasPasswordChange) {
      // ตรวจสอบว่ากรอกครบหรือไม่
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setMessage('กรุณากรอกรหัสผ่านเดิม, รหัสผ่านใหม่ และยืนยันรหัสผ่านให้ครบถ้วน');
        return;
      }
      
      // ตรวจสอบว่ารหัสผ่านใหม่ตรงกันหรือไม่
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage('รหัสผ่านใหม่ไม่ตรงกัน');
        return;
      }
      
      // ตรวจสอบความยาวรหัสผ่าน
      if (passwordData.newPassword.length < 6) {
        setMessage('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
    }
    
    try {
      const requestBody = { ...formData };
      
      // ถ้ามีการแก้ไขรหัสผ่าน ให้เพิ่ม oldPassword และ newPassword
      if (hasPasswordChange) {
        requestBody.oldPassword = passwordData.oldPassword;
        requestBody.newPassword = passwordData.newPassword;
      }
      
      const response = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาด');
      }
      
      // ล้างข้อมูลรหัสผ่านหลังจากบันทึกสำเร็จ
      if (hasPasswordChange) {
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
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

  const handlePrefsSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const allergens = prefs.allergensText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const body = {
        calorie_limit: prefs.calorie_limit === '' ? null : Number(prefs.calorie_limit),
        allergens,
      };
      const response = await fetch('http://localhost:3000/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'อัปเดตการตั้งค่าล้มเหลว');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
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

                {/* ส่วนแก้ไขรหัสผ่าน */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">เปลี่ยนรหัสผ่าน (ไม่บังคับ)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="oldPassword" className="block mb-2 text-sm font-medium text-gray-900">รหัสผ่านเดิม</label>
                      <input
                        type="password"
                        name="oldPassword"
                        id="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                        placeholder="กรอกเฉพาะเมื่อต้องการเปลี่ยนรหัสผ่าน"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-900">รหัสผ่านใหม่</label>
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-900">ยืนยันรหัสผ่านใหม่</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      />
                    </div>
                  </div>
                </div>
                {/* --- จบส่วนของฟอร์ม --- */}

                <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                  บันทึกการเปลี่ยนแปลง
                </button>
                {message && <p className="text-center text-sm text-red-600 mt-4">{message}</p>}
              </form>

              <hr className="my-6" />
              <h2 className="text-lg font-semibold">การตั้งค่าโภชนาการ</h2>
              <form onSubmit={handlePrefsSave} className="space-y-4">
                <div>
                  <label htmlFor="calorie_limit" className="block mb-2 text-sm font-medium text-gray-900">ขีดจำกัดแคลอรี่ต่อวัน</label>
                  <input
                    type="number"
                    id="calorie_limit"
                    value={prefs.calorie_limit}
                    onChange={(e) => setPrefs({ ...prefs, calorie_limit: e.target.value })}
                    className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                    placeholder="เช่น 2000"
                  />
                </div>
                <div>
                  <label htmlFor="allergens" className="block mb-2 text-sm font-medium text-gray-900">แพ้อาหาร (คั่นด้วย ,)</label>
                  <input
                    type="text"
                    id="allergens"
                    value={prefs.allergensText}
                    onChange={(e) => setPrefs({ ...prefs, allergensText: e.target.value })}
                    className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                    placeholder="เช่น ถั่ว, นม, กุ้ง"
                  />
                </div>
                <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                  บันทึกการตั้งค่า
                </button>
              </form>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default ProfilePage;