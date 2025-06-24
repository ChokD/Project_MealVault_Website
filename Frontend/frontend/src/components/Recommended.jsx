import React from 'react';

// ย้าย MenuCard มาเป็น Component ของตัวเองเพื่อความสะอาด
function MenuCard({ image, title }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <img className="w-full h-48 object-cover" src={image} alt={title} />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <a href="#" className="text-sm text-green-600 font-semibold hover:underline">
          ดูสูตรและวิธีทำ →
        </a>
      </div>
    </div>
  );
}

function Recommended() {
  // ข้อมูลตัวอย่าง
  const sampleMenus = [
    { id: 1, image: 'https://images.services.kitchenstories.io/fVn855l8w63sW4n2o9aT8bJgOAY=/1080x0/filters:quality(85)/images.kitchenstories.io/recipeImages/RP04_09_03_ThaiBasilPork_Final_4x3.jpg', title: 'ผัดกระเพรา' },
    { id: 2, image: 'https://img.kapook.com/u/2015/05/sarinee/m1.jpg', title: 'ต้มยำกุ้ง' },
    { id: 3, image: 'https://i.ytimg.com/vi/gD4pS_2kYqA/maxresdefault.jpg', title: 'ข้าวผัดไข่' },
  ];

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-8 text-center md:text-left">เมนูแนะนำ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sampleMenus.map(menu => (
          <MenuCard key={menu.id} image={menu.image} title={menu.title} />
        ))}
      </div>
    </section>
  );
}

export default Recommended;