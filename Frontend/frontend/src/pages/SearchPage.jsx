import React, { useState } from 'react'; // 1. เพิ่ม useState
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AccordionItem from '../components/AccordionItem'; // 2. เปลี่ยนมา import AccordionItem

function SearchPage() {
  const location = useLocation();
  const { results, query } = location.state || { results: [], query: '' };

  // 3. เพิ่ม State สำหรับจัดการ Accordion
  const [openPostId, setOpenPostId] = useState(null);

  const handleToggle = (postId) => {
    setOpenPostId(openPostId === postId ? null : postId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">ผลการค้นหาสำหรับ: "{query}"</h1>
          <p className="text-gray-600 mb-8">{results.length} เมนูที่พบ</p>

          {results.length > 0 ? (
            // 4. เปลี่ยนจากการแสดง Grid มาเป็นการแสดง Accordion
            <div className="space-y-4">
              {results.map(menu => (
                // เราจะส่งข้อมูลเมนูไปให้ AccordionItem
                <AccordionItem 
                  key={menu.menu_id} 
                  // แปลงข้อมูลเมนูให้ตรงกับที่ AccordionItem คาดหวัง
                  post={{ 
                    cpost_id: menu.menu_id, 
                    cpost_title: menu.menu_name,
                    user_fname: 'ระบบ', // อาจจะไม่มีชื่อผู้โพสต์ในผลการค้นหาเมนู
                  }} 
                  isOpen={openPostId === menu.menu_id}
                  onToggle={() => handleToggle(menu.menu_id)}
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