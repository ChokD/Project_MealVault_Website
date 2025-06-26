import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostSummaryCard from '../components/PostSummaryCard'; // เราจะใช้การ์ดเดิมมาแสดงผล

function SearchPage() {
  const location = useLocation();
  const { results, query } = location.state || { results: [], query: '' }; // รับผลลัพธ์และคำค้นหา

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">ผลการค้นหาสำหรับ: "{query}"</h1>
          <p className="text-gray-600 mb-8">{results.length} เมนูที่พบ</p>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* เราจะใช้ PostSummaryCard มาแสดงผลเมนู แต่ต้องปรับแก้เล็กน้อย */}
              {results.map(menu => (
                // ในอนาคตอาจจะสร้าง MenuCard แยก แต่ตอนนี้ใช้ PostCard ไปก่อน
                // เราต้องส่งข้อมูลให้ตรงกับที่ PostSummaryCard คาดหวัง
                <PostSummaryCard 
                  key={menu.menu_id} 
                  post={{ 
                    cpost_id: menu.menu_id, 
                    cpost_title: menu.menu_name,
                    // อาจจะต้องเพิ่ม user_fname หรือปรับแก้ Card
                  }} 
                />
              ))}
            </div>
          ) : (
            <p>ไม่พบเมนูที่สามารถทำได้จากวัตถุดิบที่คุณระบุ</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default SearchPage;