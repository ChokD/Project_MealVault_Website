import React from 'react';

// สร้าง Component ของการ์ดเมนูแต่ละอัน
function MenuCard({ image, title }) {
  return (
    <div className="menu-card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <a href="#">ดูสูตรและวิธีทำ →</a>
    </div>
  );
}

function Recommended() {
  return (
    <div className="recommended-section">
      <h2>เมนูแนะนำ</h2>
      <div className="menu-grid">
        <MenuCard image="https://via.placeholder.com/300x200.png?text=ผัดกระเพรา" title="ผัดกระเพรา" />
        <MenuCard image="https://via.placeholder.com/300x200.png?text=ต้มยำกุ้ง" title="ต้มยำกุ้ง" />
        <MenuCard image="https://via.placeholder.com/300x200.png?text=ข้าวผัดไข่" title="ข้าวผัดไข่" />
      </div>
    </div>
  );
}

export default Recommended;