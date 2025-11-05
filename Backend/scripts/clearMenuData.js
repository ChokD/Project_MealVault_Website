require('dotenv').config();
const { supabase } = require('../config/supabase');

async function clearMenuData() {
  try {
    console.log('กำลังลบข้อมูลเมนู วัตถุดิบ และการเชื่อมโยง...');

    // ลบข้อมูลตามลำดับ (ต้องลบ foreign key ก่อน)
    // 1. ลบ MenuIngredient (foreign key)
    const { error: menuIngError } = await supabase
      .from('MenuIngredient')
      .delete()
      .neq('id', 0); // ลบทั้งหมด

    if (menuIngError) {
      console.error('Error deleting MenuIngredient:', menuIngError);
    } else {
      console.log('✓ ลบ MenuIngredient แล้ว');
    }

    // 2. ลบ Ingredient
    const { error: ingError } = await supabase
      .from('Ingredient')
      .delete()
      .neq('ingredient_id', ''); // ลบทั้งหมด

    if (ingError) {
      console.error('Error deleting Ingredient:', ingError);
    } else {
      console.log('✓ ลบ Ingredient แล้ว');
    }

    // 3. ลบ Menu
    const { error: menuError } = await supabase
      .from('Menu')
      .delete()
      .neq('menu_id', ''); // ลบทั้งหมด

    if (menuError) {
      console.error('Error deleting Menu:', menuError);
    } else {
      console.log('✓ ลบ Menu แล้ว');
    }

    // 4. ลบ Category (ถ้าเป็น Thai Food)
    const { error: catError } = await supabase
      .from('Category')
      .delete()
      .eq('category_name', 'Thai Food');

    if (catError) {
      console.error('Error deleting Category:', catError);
    } else {
      console.log('✓ ลบ Category (Thai Food) แล้ว');
    }

    console.log('\n=== ลบข้อมูลเสร็จสิ้น ===');
    console.log('ตอนนี้สามารถรัน importExcelData.js ใหม่ได้แล้ว');

  } catch (error) {
    console.error('Error clearing menu data:', error);
  }
}

// รันสคริปต์
if (require.main === module) {
  clearMenuData()
    .then(() => {
      console.log('การลบข้อมูลเสร็จสิ้น');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { clearMenuData };

