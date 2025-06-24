import React from 'react';

function Hero() {
  return (
    <section className="text-center py-12 md:py-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        ค้นหาเมนูอาหารจากวัตถุดิบของคุณ
      </h2>
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-2xl flex items-center bg-white border border-gray-200 rounded-full shadow-lg p-2">
          <input 
            type="text" 
            placeholder="เช่น หมู, กะเพรา, พริก..." 
            className="w-full px-4 py-2 text-gray-700 focus:outline-none rounded-full"
          />
          <button className="bg-green-500 text-white font-bold rounded-full px-8 py-2 hover:bg-green-600 transition-colors duration-300">
            ค้นหา
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;