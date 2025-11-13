require('dotenv').config();
const { supabase } = require('../config/supabase');

/**
 * สคริปต์สำหรับอัพเดต category_id ให้เมนูที่มีอยู่แล้ว
 * วิเคราะห์จากชื่อเมนูเท่านั้นเพื่อกำหนดหมวดหมู่ให้อัตโนมัติ
 */

// กำหนดคำหลักสำหรับแต่ละหมวดหมู่ (อ้างอิงจากชื่อเมนู)
const categoryKeywords = {
  'ปิ้ง': ['ปิ้ง', 'ย่าง', 'grill', 'barbecue', 'bbq'],
  'ผัด': ['ผัด', 'stir', 'fry', 'wok'],
  'ทอด': ['ทอด', 'deep fry', 'fried', 'fry'],
  'ย่าง': ['ย่าง', 'grill', 'barbecue', 'bbq', 'roast'],
  'ต้ม': ['ต้ม', 'boil', 'soup', 'น้ำ', 'แกงน้ำใส'],
  'นึ่ง': ['นึ่ง', 'steam', 'steamed'],
  'อบ': ['อบ', 'bake', 'baked', 'oven'],
  'แกง': ['แกง', 'curry', 'แกงกะทิ', 'แกงเผ็ด', 'แกงเขียวหวาน', 'แกงมัสมั่น', 'แกงส้ม', 'แกงเลียง']
};

/**
 * วิเคราะห์และกำหนดหมวดหมู่ให้เมนูจากชื่อเมนูเท่านั้น
 * @param {string} menuName - ชื่อเมนู
 * @returns {string} - ชื่อหมวดหมู่ที่ตรวจพบ
 */
function detectCategory(menuName) {
  if (!menuName) {
    return 'อื่นๆ';
  }
  
  const text = menuName.toLowerCase();
  
  // นับคะแนนของแต่ละหมวดหมู่
  const scores = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category]++;
      }
    }
  }
  
  // หาหมวดหมู่ที่มีคะแนนสูงสุด
  let maxScore = 0;
  let detectedCategory = 'อื่นๆ'; // default
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }
  
  // ถ้าไม่มีคะแนนเลย ให้ใช้ 'อื่นๆ'
  if (maxScore === 0) {
    detectedCategory = 'อื่นๆ';
  }
  
  return detectedCategory;
}

/**
 * อัพเดต category_id ให้เมนูทั้งหมด
 */
async function updateMenuCategories() {
  try {
    console.log('เริ่มต้นอัพเดตหมวดหมู่ให้เมนู...\n');

    // 1. ดึงหมวดหมู่ทั้งหมด
    const { data: categories, error: catError } = await supabase
      .from('Category')
      .select('category_id, category_name')
      .order('category_name');

    if (catError) throw catError;

    if (!categories || categories.length === 0) {
      console.log('❌ ไม่พบหมวดหมู่ในฐานข้อมูล กรุณารัน seedCookingCategories.js ก่อน');
      return;
    }

    // สร้าง map สำหรับค้นหา category_id จากชื่อ
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.category_name] = cat.category_id;
    });

    console.log('📋 หมวดหมู่ที่มีในระบบ:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category_name} (${cat.category_id})`);
    });
    console.log('');

    // 2. ดึงเมนูทั้งหมด
    const { data: menus, error: menuError } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, category_id');

    if (menuError) throw menuError;

    if (!menus || menus.length === 0) {
      console.log('⚠️  ไม่พบเมนูในฐานข้อมูล');
      return;
    }

    console.log(`พบเมนูทั้งหมด ${menus.length} รายการ\n`);

    // 3. อัพเดตหมวดหมู่ให้แต่ละเมนู
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const updateLog = [];

    for (const menu of menus) {
      try {
        // วิเคราะห์หมวดหมู่จากชื่อเมนูเท่านั้น
        const detectedCategory = detectCategory(menu.menu_name);

        const newCategoryId = categoryMap[detectedCategory];

        if (!newCategoryId) {
          console.log(`⚠️  ไม่พบ category_id สำหรับ "${detectedCategory}" - ข้ามเมนู: ${menu.menu_name}`);
          skippedCount++;
          continue;
        }

        // ถ้า category_id ถูกต้องแล้ว ไม่ต้องอัพเดต
        if (menu.category_id === newCategoryId) {
          skippedCount++;
          continue;
        }

        // อัพเดต category_id
        const { error: updateError } = await supabase
          .from('Menu')
          .update({ category_id: newCategoryId })
          .eq('menu_id', menu.menu_id);

        if (updateError) {
          console.error(`❌ เกิดข้อผิดพลาดในการอัพเดต ${menu.menu_name}:`, updateError.message);
          errorCount++;
          continue;
        }

        updatedCount++;
        updateLog.push({
          menu: menu.menu_name,
          oldCategory: menu.category_id || 'ไม่มี',
          newCategory: detectedCategory,
          newCategoryId: newCategoryId
        });

        console.log(`✅ อัพเดต: ${menu.menu_name} -> ${detectedCategory}`);

      } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการประมวลผล ${menu.menu_name}:`, error.message);
        errorCount++;
      }
    }

    // 4. แสดงสรุปผล
    console.log('\n=== สรุปผลการอัพเดต ===');
    console.log(`✅ อัพเดตสำเร็จ: ${updatedCount} เมนู`);
    console.log(`⏭️  ข้าม (ไม่ต้องอัพเดต): ${skippedCount} เมนู`);
    console.log(`❌ เกิดข้อผิดพลาด: ${errorCount} เมนู`);
    console.log(`📊 รวมทั้งหมด: ${menus.length} เมนู\n`);

    // แสดงรายละเอียดการอัพเดต
    if (updateLog.length > 0) {
      console.log('📝 รายละเอียดการอัพเดต:');
      updateLog.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.menu}`);
        console.log(`      เปลี่ยนจาก: ${log.oldCategory} -> ${log.newCategory} (${log.newCategoryId})`);
      });
    }

    // 5. แสดงสถิติหมวดหมู่
    console.log('\n📊 สถิติเมนูตามหมวดหมู่:');
    const { data: menuStats, error: statsError } = await supabase
      .from('Menu')
      .select('category_id, category:Category(category_name)');

    if (!statsError && menuStats) {
      const stats = {};
      menuStats.forEach(menu => {
        const catName = menu.category?.category_name || 'ไม่มีหมวดหมู่';
        stats[catName] = (stats[catName] || 0) + 1;
      });

      Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([catName, count]) => {
          console.log(`   - ${catName}: ${count} เมนู`);
        });
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดร้ายแรง:', error);
    process.exit(1);
  }
}

// รันสคริปต์
if (require.main === module) {
  updateMenuCategories()
    .then(() => {
      console.log('\n✨ เสร็จสิ้น!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ เกิดข้อผิดพลาด:', error);
      process.exit(1);
    });
}

module.exports = { updateMenuCategories, detectCategory };

