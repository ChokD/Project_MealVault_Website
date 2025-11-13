require('dotenv').config();
const { supabase } = require('../config/supabase');

/**
 * สคริปต์สำหรับเพิ่มหมวดหมู่วิธีทำอาหารเริ่มต้น
 * หมวดหมู่: ปิ้ง, ผัด, ทอด, ย่าง, ต้ม, นึ่ง, อบ, แกง
 */
async function seedCookingCategories() {
  try {
    console.log('เริ่มต้นเพิ่มหมวดหมู่วิธีทำอาหาร...\n');

    // กำหนดหมวดหมู่วิธีทำอาหาร
    const cookingCategories = [
      { category_id: 'CAT001', category_name: 'ปิ้ง' },
      { category_id: 'CAT002', category_name: 'ผัด' },
      { category_id: 'CAT003', category_name: 'ทอด' },
      { category_id: 'CAT004', category_name: 'ย่าง' },
      { category_id: 'CAT005', category_name: 'ต้ม' },
      { category_id: 'CAT006', category_name: 'นึ่ง' },
      { category_id: 'CAT007', category_name: 'อบ' },
      { category_id: 'CAT008', category_name: 'แกง' },
      { category_id: 'CAT009', category_name: 'อื่นๆ' }
    ];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const category of cookingCategories) {
      try {
        // ตรวจสอบว่ามีหมวดหมู่นี้อยู่แล้วหรือไม่
        const { data: existing, error: checkError } = await supabase
          .from('Category')
          .select('category_id')
          .eq('category_id', category.category_id)
          .limit(1);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
          console.log(`⏭️  ข้าม: ${category.category_name} (มีอยู่แล้ว)`);
          skipCount++;
          continue;
        }

        // เพิ่มหมวดหมู่ใหม่
        const { error: insertError } = await supabase
          .from('Category')
          .insert([category]);

        if (insertError) {
          // ถ้า category_id ซ้ำ แต่ชื่อต่าง ให้ลองใช้ ID ใหม่
          if (insertError.code === '23505') {
            const newId = 'C' + Date.now().toString().slice(-6) + Math.random().toString().slice(-3);
            const { error: retryError } = await supabase
              .from('Category')
              .insert([{ ...category, category_id: newId }]);
            
            if (retryError) throw retryError;
            console.log(`✅ เพิ่มสำเร็จ: ${category.category_name} (ID: ${newId})`);
          } else {
            throw insertError;
          }
        } else {
          console.log(`✅ เพิ่มสำเร็จ: ${category.category_name}`);
        }
        successCount++;

      } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการเพิ่ม ${category.category_name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== สรุปผลการเพิ่มหมวดหมู่ ===');
    console.log(`✅ เพิ่มสำเร็จ: ${successCount} หมวดหมู่`);
    console.log(`⏭️  ข้าม (มีอยู่แล้ว): ${skipCount} หมวดหมู่`);
    console.log(`❌ เกิดข้อผิดพลาด: ${errorCount} หมวดหมู่`);
    console.log(`📊 รวมทั้งหมด: ${cookingCategories.length} หมวดหมู่\n`);

    // แสดงหมวดหมู่ทั้งหมดที่มีในฐานข้อมูล
    const { data: allCategories, error: fetchError } = await supabase
      .from('Category')
      .select('category_id, category_name')
      .order('category_name');

    if (!fetchError && allCategories) {
      console.log('📋 หมวดหมู่ทั้งหมดในฐานข้อมูล:');
      allCategories.forEach(cat => {
        console.log(`   - ${cat.category_name} (${cat.category_id})`);
      });
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดร้ายแรง:', error);
    process.exit(1);
  }
}

// รันสคริปต์
if (require.main === module) {
  seedCookingCategories()
    .then(() => {
      console.log('\n✨ เสร็จสิ้น!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ เกิดข้อผิดพลาด:', error);
      process.exit(1);
    });
}

module.exports = { seedCookingCategories };

