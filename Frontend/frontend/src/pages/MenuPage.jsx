import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function MenuPage () {
    const [openIndex, setOpenIndex] = React.useState(null);
    const [favorites, setFavorites] = React.useState([]);

    const menuItems = [
        {
            title: "ข้าวผัดกุ้ง",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
            desc: "ข้าวผัดหอมๆ กับกุ้งสดตัวโต เสิร์ฟพร้อมแตงกวาและมะนาว",
            detail: "ข้าวผัดกุ้งเป็นเมนูยอดนิยมที่ใช้ข้าวสวยผัดกับกุ้งสด ไข่ และผักต่างๆ ปรุงรสด้วยซอสและเครื่องปรุงไทย เสิร์ฟพร้อมแตงกวาและมะนาวเพื่อเพิ่มความสดชื่น"
        },
        {
            title: "ผัดไทยกุ้งสด",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80",
            desc: "เส้นจันท์เหนียวนุ่ม ผัดกับซอสสูตรพิเศษและกุ้งสด",
            detail: "ผัดไทยกุ้งสดเป็นอาหารจานเดียวที่มีเส้นจันท์เหนียวนุ่ม ผัดกับซอสผัดไทยสูตรพิเศษ ใส่กุ้งสด เต้าหู้ ถั่วงอก และโรยถั่วลิสงคั่ว"
        },
        {
            title: "สปาเก็ตตี้คาโบนาร่า",
            image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80",
            desc: "เส้นสปาเก็ตตี้คลุกซอสครีมเข้มข้น โรยเบคอนกรอบ",
            detail: "สปาเก็ตตี้คาโบนาร่าเป็นเมนูสไตล์อิตาเลียน ใช้เส้นสปาเก็ตตี้คลุกกับซอสครีม ไข่ และชีส โรยหน้าด้วยเบคอนกรอบ"
        },
        {
            title: "ต้มยำกุ้ง",
            image: "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=600&q=80",
            desc: "ซุปต้มยำรสจัดจ้าน ใส่กุ้งสด เห็ด และสมุนไพรไทย",
            detail: "ต้มยำกุ้งเป็นซุปไทยรสจัดจ้าน ใช้กุ้งสด เห็ด ข่า ตะไคร้ ใบมะกรูด และพริกสด ปรุงรสเปรี้ยวเผ็ดกลมกล่อม"
        },
        {
            title: "ข้าวมันไก่",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
            desc: "ข้าวมันหอมกรุ่น เสิร์ฟพร้อมไก่นุ่ม น้ำจิ้มรสเด็ด",
            detail: "ข้าวมันไก่เป็นอาหารจานเดียวที่ใช้ข้าวหุงกับน้ำซุปไก่ เสิร์ฟพร้อมไก่ต้มเนื้อนุ่มและน้ำจิ้มรสเด็ด"
        },
        {
            title: "ข้าวหน้าเนื้อ",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80",
            desc: "ข้าวสวยร้อนๆ ราดเนื้อผัดซอสญี่ปุ่น โรยต้นหอม",
            detail: "ข้าวหน้าเนื้อเป็นเมนูสไตล์ญี่ปุ่น ใช้เนื้อวัวผัดกับซอสญี่ปุ่น ราดบนข้าวสวยร้อนๆ โรยต้นหอม"
        }
    ];

    const toggleFavorite = (idx) => {
        setFavorites((prev) =>
            prev.includes(idx)
                ? prev.filter(i => i !== idx)
                : [...prev, idx]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-200">
            <Navbar />
            <div className="pt-24 max-w-6xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-green-700 mb-6 text-center drop-shadow">เมนูอาหาร</h1>
                <p className="text-lg text-gray-700 mb-10 text-center">
                    สำรวจเมนูอาหารหลากหลายที่เราคัดสรรมาให้คุณ ทั้งอาหารจานเดียว อาหารไทย อาหารนานาชาติ และของหวานสุดอร่อย!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {menuItems.map((item, idx) => (
                        <div key={item.title} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition relative">
                            {/* Favorite Button */}
                            <button
                                onClick={() => toggleFavorite(idx)}
                                className="absolute top-3 right-3 z-10 text-red-500 hover:scale-110 transition focus:outline-none"
                                aria-label={favorites.includes(idx) ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
                            >
                                {favorites.includes(idx) ? (
                                    // Filled heart
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-7 h-7">
                                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                                    </svg>
                                ) : (
                                    // Outline heart
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-7 h-7">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.75a5.25 5.25 0 00-4.5 2.472A5.25 5.25 0 007.5 4.75C5.014 4.75 3 6.764 3 9.25c0 2.485 2.136 4.5 5.385 7.364l1.115 1.01a2.25 2.25 0 002.998 0l1.115-1.01C18.864 13.75 21 11.735 21 9.25c0-2.486-2.014-4.5-4.5-4.5z"/>
                                    </svg>
                                )}
                            </button>
                            <img src={item.image} alt={item.title} className="w-full h-48 object-cover"/>
                            <div className="p-5">
                                <h2 className="text-xl font-semibold text-green-600 mb-2">{item.title}</h2>
                                <p className="text-gray-600 mb-4">{item.desc}</p>
                                <button
                                    onClick={() => setOpenIndex(idx)}
                                    className="text-green-500 hover:underline font-medium focus:outline-none"
                                >
                                    อ่านเพิ่มเติม
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-12 flex justify-center">
                    <Link to="/" className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition">
                        กลับสู่หน้าแรก
                    </Link>
                </div>
            </div>
            {/* Modal */}
            {openIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-10 relative">
                        <button
                            onClick={() => setOpenIndex(null)}
                            className="absolute top-3 right-4 text-gray-400 hover:text-green-600 text-3xl font-bold"
                            aria-label="ปิด"
                        >
                            ×
                        </button>
                        <img src={menuItems[openIndex].image} alt={menuItems[openIndex].title} className="w-full h-72 object-cover rounded-lg mb-6"/>
                        <h2 className="text-3xl font-bold text-green-700 mb-4">{menuItems[openIndex].title}</h2>
                        <p className="text-lg text-gray-700 mb-4">{menuItems[openIndex].detail}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;