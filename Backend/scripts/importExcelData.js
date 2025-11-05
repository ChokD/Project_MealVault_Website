require('dotenv').config();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

async function importExcelData() {
  try {
    // อ่านไฟล์ Excel
    const excelPath = path.join(__dirname, '../../thai_food_dataset_with_urls.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('ไม่พบไฟล์ Excel:', excelPath);
      return;
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`พบข้อมูล ${data.length} รายการ`);

    // สร้างหมวดหมู่สำหรับอาหารไทย
    const defaultCategory = 'Thai Food';
    let categoryId = 'CAT001';

    // ตรวจสอบว่ามีหมวดหมู่อยู่แล้วหรือไม่
    const { data: existingCategories } = await supabase
      .from('Category')
      .select('category_id')
      .eq('category_name', defaultCategory)
      .limit(1);

    if (!existingCategories || existingCategories.length === 0) {
      const { error: catError } = await supabase
        .from('Category')
        .insert([{ category_id: categoryId, category_name: defaultCategory }]);
      
      if (catError) {
        console.error('Error creating category:', catError);
        categoryId = null;
      }
    } else {
      categoryId = existingCategories[0].category_id;
    }

    // นำเข้าข้อมูลเมนู
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // ดึงข้อมูลจาก Excel (ตามโครงสร้างที่ตรวจสอบแล้ว)
        const menuName = row['name'] || '';
        
        if (!menuName) {
          console.log(`ข้ามแถวที่ ${i + 1}: ไม่มีชื่ออาหาร`);
          continue;
        }

        // ตรวจสอบว่ามีเมนูนี้อยู่แล้วหรือไม่
        const { data: existingMenus } = await supabase
          .from('Menu')
          .select('menu_id')
          .eq('menu_name', menuName)
          .limit(1);

        if (existingMenus && existingMenus.length > 0) {
          console.log(`ข้ามเมนู: ${menuName} (มีอยู่แล้ว)`);
          continue;
        }

        // สร้าง menu_id
        const menuId = 'M' + Date.now().toString().slice(-6) + i.toString().padStart(3, '0');

        // ดึงข้อมูลจาก Excel
        const menuText = row['text'] || '';
        const menuDescription = menuText.split('##')[0]?.trim() || menuText.substring(0, 200) || menuName;
        const menuRecipe = row['recipe_steps'] || menuText || '';
        const menuImage = row['image_url'] || 'no-image.png';
        
        // รวบรวมวัตถุดิบ
        let ingredients = [];
        const ingredientsText = row['ingredients'] || '';
        if (ingredientsText) {
          // แยกวัตถุดิบจาก text (แต่ละบรรทัดเป็นวัตถุดิบ)
          ingredients = ingredientsText.split('\n')
            .map(ing => ing.trim())
            .filter(ing => ing && ing !== '');
        }

        // สร้างเมนูใหม่
        const newMenu = {
          menu_id: menuId,
          menu_name: menuName,
          menu_description: menuDescription || menuName,
          menu_recipe: menuRecipe || menuDescription || 'ไม่มีข้อมูลวิธีทำ',
          menu_image: menuImage || 'no-image.png',
          menu_datetime: new Date().toISOString(),
          category_id: categoryId
        };

        const { error: menuError } = await supabase
          .from('Menu')
          .insert([newMenu]);

        if (menuError) {
          console.error(`Error inserting menu ${menuName}:`, menuError);
          errorCount++;
          continue;
        }

        // เพิ่มวัตถุดิบ
        if (ingredients.length > 0) {
          for (const ingredientText of ingredients) {
            // เก็บทั้งชื่อและปริมาณ (ไม่แยกออกจากกัน)
            const ingredientName = ingredientText.trim();
            
            if (!ingredientName || ingredientName.length === 0) continue;
            
            // สร้าง ingredient_id (ใช้ hash แบบง่าย)
            const ingredientId = 'ING' + Math.abs(ingredientName.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0)).toString().padStart(6, '0');
            
            // ตรวจสอบว่ามีวัตถุดิบอยู่แล้วหรือไม่
            const { data: existingIngredient } = await supabase
              .from('Ingredient')
              .select('ingredient_id')
              .eq('ingredient_name', ingredientName)
              .limit(1);

            let finalIngredientId = ingredientId;

            if (!existingIngredient || existingIngredient.length === 0) {
              // สร้างวัตถุดิบใหม่
              const { error: ingError } = await supabase
                .from('Ingredient')
                .insert([{ ingredient_id: ingredientId, ingredient_name: ingredientName }]);
              
              if (ingError && !ingError.message.includes('duplicate') && !ingError.message.includes('unique')) {
                console.error(`Error creating ingredient ${ingredientName}:`, ingError);
                continue; // ข้ามวัตถุดิบนี้ถ้าไม่สามารถสร้างได้
              }
            } else {
              // ใช้ ingredient_id ที่มีอยู่แล้ว
              finalIngredientId = existingIngredient[0].ingredient_id;
            }

            // เชื่อมเมนูกับวัตถุดิบ
            const { error: linkError } = await supabase
              .from('MenuIngredient')
              .insert([{ menu_id: menuId, ingredient_id: finalIngredientId }]);

            if (linkError && !linkError.message.includes('duplicate') && !linkError.message.includes('unique')) {
              // ถ้ามีอยู่แล้วก็ไม่เป็นไร (อาจจะลิงก์ซ้ำ)
              if (!linkError.message.includes('already exists')) {
                console.error(`Error linking ingredient ${ingredientName}:`, linkError);
              }
            }
          }
        }

        successCount++;
        console.log(`✓ นำเข้าเมนูที่ ${i + 1}: ${menuName}`);

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== สรุปการนำเข้า ===');
    console.log(`สำเร็จ: ${successCount} รายการ`);
    console.log(`ผิดพลาด: ${errorCount} รายการ`);
    console.log(`ทั้งหมด: ${data.length} รายการ`);

  } catch (error) {
    console.error('Error importing Excel data:', error);
  }
}

// รันสคริปต์
if (require.main === module) {
  importExcelData()
    .then(() => {
      console.log('การนำเข้าข้อมูลเสร็จสิ้น');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { importExcelData };

