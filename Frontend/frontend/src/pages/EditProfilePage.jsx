import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import SuccessAnimation from '../components/SuccessAnimation';

const API_URL = 'http://localhost:3000/api';

function EditProfilePage() {
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
  const [prefsMessage, setPrefsMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({ calorie_limit: '', allergensText: '', favoriteFoodsText: '' });

  // ดึงข้อมูลผู้ใช้ปัจจุบันมาแสดงตอนเปิดหน้า
  useEffect(() => {
    if (user) {
      setFormData({
        user_fname: user.user_fname || '',
        user_lname: user.user_lname || '',
        user_tel: user.user_tel || '',
      });
      // โหลด preferences จาก API
      const fetchPrefs = async () => {
        try {
          const resp = await fetch(`${API_URL}/preferences`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await resp.json();
          const allergensText = Array.isArray(data.allergens) ? data.allergens.join(', ') : '';
          const favoriteFoodsText = Array.isArray(data.favorite_foods) ? data.favorite_foods.join(', ') : '';
          setPrefs({
            calorie_limit: data.calorie_limit ?? '',
            allergensText,
            favoriteFoodsText,
          });
        } catch (_) {}
        setLoading(false);
      };
      fetchPrefs();
    } else if (!token) {
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
    
    const hasPasswordChange = passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword;
    
    if (hasPasswordChange) {
      if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setMessage('กรุณากรอกรหัสผ่านเดิม, รหัสผ่านใหม่ และยืนยันรหัสผ่านให้ครบถ้วน');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage('รหัสผ่านใหม่ไม่ตรงกัน');
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        setMessage('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }
    }
    
    try {
      const requestBody = { ...formData };
      
      if (hasPasswordChange) {
        requestBody.oldPassword = passwordData.oldPassword;
        requestBody.newPassword = passwordData.newPassword;
      }
      
      const response = await fetch(`${API_URL}/users/profile`, {
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
      
      if (hasPasswordChange) {
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/profile');
        window.location.reload(); // Reload to update user context
      }, 2000);

    } catch (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handlePrefsSave = async (e) => {
    e.preventDefault();
    setPrefsMessage('');
    try {
      const allergens = prefs.allergensText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const favorite_foods = prefs.favoriteFoodsText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const body = {
        calorie_limit: prefs.calorie_limit === '' ? null : Number(prefs.calorie_limit),
        allergens,
        favorite_foods,
      };
      const response = await fetch(`${API_URL}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'อัปเดตการตั้งค่าล้มเหลว');
      setPrefsMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว!');
      setTimeout(() => setPrefsMessage(''), 2000);
    } catch (error) {
      setPrefsMessage('เกิดข้อผิดพลาด: ' + error.message);
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
      <main className="flex-grow pt-24 px-4 md:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">แก้ไขข้อมูลส่วนตัว</h1>
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {showSuccess ? (
              <SuccessAnimation message="บันทึกข้อมูลสำเร็จ!" />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="flex gap-3">
                  <button type="submit" className="flex-1 text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                    บันทึกการเปลี่ยนแปลง
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 font-medium rounded-full text-sm text-center"
                  >
                    ยกเลิก
                  </button>
                </div>
                {message && <p className="text-center text-sm text-red-600 mt-4">{message}</p>}
              </form>
            )}
          </div>

          {/* ส่วนการตั้งค่าโภชนาการ */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">การตั้งค่าโภชนาการ</h2>
            
            <form onSubmit={handlePrefsSave} className="space-y-6">
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
                <p className="mt-1 text-xs text-gray-500">กรอกอาหารที่แพ้โดยคั่นด้วยเครื่องหมายจุลภาค (เช่น ถั่ว, นม, กุ้ง)</p>
              </div>
              <div>
                <label htmlFor="favorite_foods" className="block mb-2 text-sm font-medium text-gray-900">อาหารที่ชอบ (คั่นด้วย ,)</label>
                <input
                  type="text"
                  id="favorite_foods"
                  value={prefs.favoriteFoodsText}
                  onChange={(e) => setPrefs({ ...prefs, favoriteFoodsText: e.target.value })}
                  className="bg-gray-50 border-b-2 border-gray-300 text-gray-900 sm:text-sm focus:ring-green-600 focus:border-green-600 block w-full p-2.5 outline-none"
                  placeholder="เช่น ข้าวผัด, ต้มยำ, ผัดไทย"
                />
                <p className="mt-1 text-xs text-gray-500">กรอกอาหารที่ชอบโดยคั่นด้วยเครื่องหมายจุลภาค (เช่น ข้าวผัด, ต้มยำ, ผัดไทย)</p>
              </div>
              <button type="submit" className="w-full text-white bg-green-500 hover:bg-green-600 font-medium rounded-full text-sm px-5 py-2.5 text-center">
                บันทึกการตั้งค่า
              </button>
              {prefsMessage && (
                <p className={`text-center text-sm mt-4 ${prefsMessage.includes('เรียบร้อย') ? 'text-green-600' : 'text-red-600'}`}>
                  {prefsMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EditProfilePage;

