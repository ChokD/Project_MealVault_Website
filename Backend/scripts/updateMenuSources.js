/**
 * Script สำหรับอัปเดตแหล่งอ้างอิงให้กับเมนูที่มีอยู่แล้ว
 * 
 * วิธีใช้งาน:
 * 1. รัน migration_add_menu_source.sql ก่อน
 * 2. แก้ไขค่าในไฟล์นี้ตามต้องการ
 * 3. รันคำสั่ง: node Backend/scripts/updateMenuSources.js
 */

require('dotenv').config();
const { supabase } = require('../config/supabase');

const menuSources = {
  // สูตรผัดกะเพรา
  'ผัดกะเพรา': {
    menu_source: 'ทีมครัวเนื้อหอม',
    menu_source_url: 'https://www.facebook.com/Sumnakkaow.PRD/posts/696744839154523?_rdc=1&_rdr#'
  },
  // สูตรเกี๊ยวกุ้ง
  'เกี๊ยวกุ้ง': {
    menu_source: 'เพจป้าหนึ่ง ตึ่งโป๊ะ cooking show',
    menu_source_url: 'https://www.facebook.com/NEWSCatDumb/posts/174997958953094'
  },
  // สูตรอื่นๆ จะใช้ค่า default นี้
  default: {
    menu_source: 'ตำรับอาหาร - เตื้อง สนิทวงศ์, ม.ร.ว., 2426-2510',
    menu_source_url: 'https://archive.org/details/unset00002426_m0n5/'
  }
};

async function updateMenuSources() {
  try {
    console.log('🚀 กำลังอัปเดตแหล่งอ้างอิงเมนู...\n');

    // ดึงเมนูทั้งหมด
    const { data: menus, error: fetchError } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_source, menu_source_url');

    if (fetchError) throw fetchError;

    if (!menus || menus.length === 0) {
      console.log('ไม่พบเมนูในระบบ');
      return;
    }

    console.log(`พบเมนูทั้งหมด ${menus.length} รายการ\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const menu of menus) {
      // หา source ที่ตรงกับชื่อเมนู
      let source = menuSources.default;
      const menuNameLower = menu.menu_name.toLowerCase();
      
      if (menuNameLower.includes('ผัดกะเพรา') || menuNameLower.includes('กะเพรา')) {
        source = menuSources['ผัดกะเพรา'];
      } else if (menuNameLower.includes('เกี๊ยวกุ้ง') || menuNameLower.includes('เกี๊ยว')) {
        source = menuSources['เกี๊ยวกุ้ง'];
      }

      // ตรวจสอบว่ามี source อยู่แล้วและตรงกับที่ต้องการหรือไม่
      if (menu.menu_source === source.menu_source && menu.menu_source_url === source.menu_source_url) {
        console.log(`⏭️  ข้าม: ${menu.menu_name} (มี source ถูกต้องแล้ว)`);
        skippedCount++;
        continue;
      }

      // อัปเดต source
      const { error: updateError } = await supabase
        .from('Menu')
        .update({
          menu_source: source.menu_source,
          menu_source_url: source.menu_source_url
        })
        .eq('menu_id', menu.menu_id);

      if (updateError) {
        console.error(`❌ เกิดข้อผิดพลาดในการอัปเดต ${menu.menu_name}:`, updateError.message);
        continue;
      }

      console.log(`✅ อัปเดต: ${menu.menu_name}`);
      console.log(`   ที่มา: ${source.menu_source}`);
      updatedCount++;
    }

    console.log('\n✨ เสร็จสิ้น!');
    console.log(`📊 สรุป: อัปเดต ${updatedCount} รายการ, ข้าม ${skippedCount} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
}

// รัน script
updateMenuSources();

