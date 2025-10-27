import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function AboutPage () {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-green-200 rounded-full opacity-10 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-200 rounded-full opacity-10 blur-3xl animate-pulse delay-75"></div>
            </div>
            
            <Navbar />
            <div className="pt-28 max-w-4xl mx-auto px-6 relative z-10">
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-green-100">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-xl">
                        <span className="text-5xl">🍽️</span>
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                        About MealVault
                    </h1>
                    
                    {/* Content */}
                    <div className="space-y-6 text-center max-w-2xl">
                        <p className="text-gray-700 text-lg leading-relaxed">
                            ยินดีต้อนรับสู่ <span className="font-bold text-green-600 text-xl">MealVault</span>! 🌱
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            เราเป็นแพลตฟอร์มที่ช่วยคุณเลือกเมนูอาหารจากวัตถุดิบเหลือใช้ เพื่อลดขยะอาหารและประหยัดค่าใช้จ่าย
                        </p>
                        
                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-6 my-8">
                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 transform hover:scale-105 transition-all duration-300">
                                <div className="text-4xl mb-3">♻️</div>
                                <h3 className="font-bold text-green-700 mb-2">ลดขยะ</h3>
                                <p className="text-sm text-gray-600">ใช้ประโยชน์จากวัตถุดิบที่เหลือ</p>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 transform hover:scale-105 transition-all duration-300">
                                <div className="text-4xl mb-3">💰</div>
                                <h3 className="font-bold text-green-700 mb-2">ประหยัดเงิน</h3>
                                <p className="text-sm text-gray-600">ใช้ของที่มีแทนการซื้อใหม่</p>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 transform hover:scale-105 transition-all duration-300">
                                <div className="text-4xl mb-3">🤝</div>
                                <h3 className="font-bold text-green-700 mb-2">ชุมชน</h3>
                                <p className="text-sm text-gray-600">แบ่งปันไอเดียเมนูอาหาร</p>
                            </div>
                        </div>
                        
                        <p className="text-gray-500 italic">
                            🍃 รักษ์โลก รักษ์กระเป๋า เริ่มต้นที่มื้ออาหารของคุณ 🍃
                        </p>
                    </div>
                    
                    {/* Button */}
                    <Link
                        to="/"
                        className="mt-8 inline-block bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg"
                    >
                        กลับสู่หน้าหลัก →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
