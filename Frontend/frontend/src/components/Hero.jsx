import React from 'react';

function Hero() {
  return (
    <div className="hero-section">
      <h2>ค้นหาเมนูอาหารจากวัตถุดิบของคุณ</h2>
      <div className="search-bar">
        <input type="text" placeholder="" />
        <button>ค้นหา</button>
      </div>
    </div>
  );
}

export default Hero;