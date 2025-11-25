const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// GET /api/weekly-meal-plan - ดึง weekly meal plan ของ user
router.get('/weekly-meal-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: planItems, error } = await supabase
      .from('WeeklyMealPlan')
      .select('*')
      .eq('user_id', userId)
      .order('day')
      .order('meal_type')
      .order('order_index');

    if (error) throw error;

    // จัดรูปแบบข้อมูลให้เหมือนกับโครงสร้างเดิม
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
    const plan = {};

    for (const day of DAYS) {
      plan[day] = {};
      for (const meal of MEALS) {
        plan[day][meal] = [];
      }
    }

    // ดึงข้อมูลเมนูทั้งหมดที่ใช้ใน plan
    if (planItems && planItems.length > 0) {
      const menuIds = [...new Set(planItems.map(item => item.menu_id))];
      const { data: menus, error: menusError } = await supabase
        .from('Menu')
        .select('menu_id, menu_name, menu_image, menu_description, menu_recipe')
        .in('menu_id', menuIds);

      if (menusError) throw menusError;

      const menuMap = new Map();
      if (menus) {
        for (const menu of menus) {
          menuMap.set(menu.menu_id, menu);
        }
      }

      // เติมข้อมูลจาก database
      for (const item of planItems) {
        const menu = menuMap.get(item.menu_id);
        if (menu && plan[item.day] && plan[item.day][item.meal_type]) {
          plan[item.day][item.meal_type].push({
            id: menu.menu_id,
            name: menu.menu_name,
            thumb: menu.menu_image || '/images/no-image.png',
            description: menu.menu_description,
            recipe: menu.menu_recipe,
            planId: item.id
          });
        }
      }
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching weekly meal plan:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนเมนูรายสัปดาห์' });
  }
});

// POST /api/weekly-meal-plan - เพิ่มเมนูเข้า weekly meal plan
router.post('/weekly-meal-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { day, meal_type, menu_id } = req.body;

    if (!day || !meal_type || !menu_id) {
      return res.status(400).json({ message: 'กรุณาระบุ day, meal_type และ menu_id' });
    }

    // ตรวจสอบว่า menu_id มีอยู่จริง
    const { data: menu, error: menuError } = await supabase
      .from('Menu')
      .select('menu_id')
      .eq('menu_id', menu_id)
      .single();

    if (menuError || !menu) {
      return res.status(404).json({ message: 'ไม่พบเมนูที่ระบุ' });
    }

    // ตรวจสอบว่ามีเมนูนี้ในวัน/มื้อเดียวกันแล้วหรือยัง
    const { data: existing, error: checkError } = await supabase
      .from('WeeklyMealPlan')
      .select('id')
      .eq('user_id', userId)
      .eq('day', day)
      .eq('meal_type', meal_type)
      .eq('menu_id', menu_id)
      .limit(1);

    if (checkError) {
      // ถ้า error เกิดจากตารางไม่มีอยู่ ให้บอกชัดเจน
      if (checkError.code === '42P01' || checkError.message?.includes('does not exist')) {
        throw new Error('ตาราง WeeklyMealPlan ยังไม่ได้สร้างในฐานข้อมูล กรุณารัน SQL script ใน Supabase');
      }
      throw checkError;
    }

    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'เมนูนี้มีอยู่ในแผนแล้ว' });
    }

    // หา order_index ล่าสุด
    const { data: lastItem, error: lastItemError } = await supabase
      .from('WeeklyMealPlan')
      .select('order_index')
      .eq('user_id', userId)
      .eq('day', day)
      .eq('meal_type', meal_type)
      .order('order_index', { ascending: false })
      .limit(1);

    if (lastItemError) {
      // ถ้า error เกิดจากตารางไม่มีอยู่ ให้บอกชัดเจน
      if (lastItemError.code === '42P01' || lastItemError.message?.includes('does not exist')) {
        throw new Error('ตาราง WeeklyMealPlan ยังไม่ได้สร้างในฐานข้อมูล กรุณารัน SQL script ใน Supabase');
      }
      throw lastItemError;
    }

    const orderIndex = lastItem && lastItem.length > 0 ? lastItem[0].order_index + 1 : 0;

    // เพิ่มเมนูเข้า plan
    const { data, error } = await supabase
      .from('WeeklyMealPlan')
      .insert([{
        user_id: userId,
        day,
        meal_type,
        menu_id,
        order_index: orderIndex
      }])
      .select()
      .single();

    if (error) {
      // ถ้า error เกิดจากตารางไม่มีอยู่ ให้บอกชัดเจน
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('ตาราง WeeklyMealPlan ยังไม่ได้สร้างในฐานข้อมูล กรุณารัน SQL script ใน Supabase');
      }
      throw error;
    }

    // ดึงข้อมูลเมนู
    const { data: menuData, error: menuDataError } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_image, menu_description, menu_recipe')
      .eq('menu_id', menu_id)
      .single();

    if (menuDataError) throw menuDataError;

    res.status(201).json({
      id: menuData.menu_id,
      name: menuData.menu_name,
      thumb: menuData.menu_image || '/images/no-image.png',
      description: menuData.menu_description,
      recipe: menuData.menu_recipe,
      planId: data.id
    });
  } catch (error) {
    console.error('Error adding menu to weekly meal plan:', error);
    // ส่ง error message ที่ชัดเจนขึ้น
    const errorMessage = error.message || error.details || 'เกิดข้อผิดพลาดในการเพิ่มเมนู';
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการเพิ่มเมนู',
      error: errorMessage,
      details: error
    });
  }
});

// DELETE /api/weekly-meal-plan/:planId - ลบเมนูออกจาก weekly meal plan
router.delete('/weekly-meal-plan/:planId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.params;

    const { error } = await supabase
      .from('WeeklyMealPlan')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'ลบเมนูสำเร็จ' });
  } catch (error) {
    console.error('Error deleting menu from weekly meal plan:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบเมนู' });
  }
});

// DELETE /api/weekly-meal-plan - ลบเมนูทั้งหมดออกจากแผนของผู้ใช้
router.delete('/weekly-meal-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('WeeklyMealPlan')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'ล้างแผนเมนูสำเร็จ' });
  } catch (error) {
    console.error('Error clearing weekly meal plan:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการล้างแผนเมนู' });
  }
});

// ฟังก์ชันลบจำนวนออกจากชื่อส่วนผสม
function removeQuantityFromIngredientName(ingredientName) {
  if (!ingredientName) return ingredientName;
  
  let cleaned = ingredientName.trim();
  
  // ลบเศษส่วนและจำนวนที่ตามด้วยหน่วย (เช่น "1/2 ช้อนโต๊ะ", "1 ช้อนชา")
  // รองรับทั้งจำนวนเต็ม เศษส่วน และทศนิยม
  cleaned = cleaned.replace(/\s*\d+(\/\d+)?(\.\d+)?\s*(ช้อนชา|ช้อนโต๊ะ|ถ้วย|กิโลกรัม|กรัม|มิลลิลิตร|ลิตร|ชิ้น|อัน|หัว|กลีบ|ใบ|ต้น|ก้าน|ผล|เม็ด|ฟอง|ตัว|แผ่น|ก้อน|กี่โล|กก|แก้ว|ถุง|ซอง|ขวด|กระป๋อง|ห่อ|แพ็ค|กล่อง)\s*/gi, '');
  
  // ลบเศษส่วนและจำนวนที่อยู่ท้ายชื่อ (เช่น "กะปิ 1/2", "เนื้อหมู 1/", "มันแกว 1/")
  // รองรับทั้ง "1/2", "1/", "1" ที่อยู่ท้าย รวมถึงทศนิยม
  // จับทั้ง "1/" และ "1/2" ที่ท้าย
  cleaned = cleaned.replace(/\s+\d+\/\d*\s*$/g, ''); // จับ "1/2" หรือ "1/" ที่ท้าย
  cleaned = cleaned.replace(/\s+\d+(\.\d+)?\s*$/g, ''); // จับ "1" หรือ "1.5" ที่ท้าย
  
  // ลบเศษส่วนและจำนวนที่อยู่หน้าชื่อ (เช่น "1/2 กะปิ", "1 เนื้อหมู")
  cleaned = cleaned.replace(/^\d+(\/\d+)?(\.\d+)?\s+\/?/g, '');
  
  // ลบเศษส่วนและจำนวนที่อยู่กลางชื่อ (เช่น "กะปิ 1/2 ช้อนโต๊ะ" -> "กะปิ")
  // แต่ต้องระวังไม่ให้ลบชื่อส่วนผสมที่มีตัวเลขเป็นส่วนหนึ่งของชื่อ
  cleaned = cleaned.replace(/\s+\d+(\/\d+)?(\.\d+)?\/?\s+/g, ' ');
  
  return cleaned.trim();
}

// GET /api/weekly-meal-plan/calculate-calories - คำนวณแคลอรี่จาก weekly meal plan โดยใช้ Gemini AI
router.get('/weekly-meal-plan/calculate-calories', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // ตรวจสอบ API Key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY กรุณาใส่ API Key ในไฟล์ .env' });
    }

    // ดึงข้อมูล calorie_limit ของ user
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('calorie_limit')
      .eq('user_id', userId)
      .limit(1);

    if (userError) throw userError;
    const calorieLimit = userData && userData.length > 0 ? userData[0].calorie_limit : null;

    // ดึง weekly meal plan
    const { data: planItems, error: planError } = await supabase
      .from('WeeklyMealPlan')
      .select('day, meal_type, menu_id')
      .eq('user_id', userId)
      .order('day')
      .order('meal_type');

    if (planError) throw planError;

    if (!planItems || planItems.length === 0) {
      return res.json({
        total_calories: 0,
        daily_calories: {},
        weekly_total: 0,
        calorie_limit: calorieLimit,
        warnings: [],
        message: 'ยังไม่มีเมนูในแผนรายสัปดาห์'
      });
    }

    // ดึงข้อมูลเมนูทั้งหมด
    const uniqueMenuIds = [...new Set(planItems.map(item => item.menu_id))];
    const { data: menus, error: menusError } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_description, menu_recipe')
      .in('menu_id', uniqueMenuIds);

    if (menusError) throw menusError;

    const menuMap = new Map();
    if (menus) {
      for (const menu of menus) {
        menuMap.set(menu.menu_id, menu);
      }
    }

    // จัดกลุ่มเมนูตามวันและมื้อ
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealPlanByDay = {};

    for (const day of DAYS) {
      mealPlanByDay[day] = {};
      for (const meal of MEALS) {
        mealPlanByDay[day][meal] = [];
      }
    }

    for (const item of planItems) {
      const menu = menuMap.get(item.menu_id);
      if (menu && mealPlanByDay[item.day] && mealPlanByDay[item.day][item.meal_type]) {
        mealPlanByDay[item.day][item.meal_type].push(menu.menu_name);
      }
    }

    // สร้าง prompt สำหรับ Gemini
    let prompt = `คุณคือผู้เชี่ยวชาญด้านโภชนาการ กรุณาคำนวณจำนวนแคลอรี่จากรายการเมนูอาหารต่อไปนี้:

`;
    
    for (const day of DAYS) {
      const dayMenus = [];
      for (const meal of MEALS) {
        if (mealPlanByDay[day][meal].length > 0) {
          dayMenus.push(`${meal}: ${mealPlanByDay[day][meal].join(', ')}`);
        }
      }
      if (dayMenus.length > 0) {
        prompt += `${day}:\n${dayMenus.join('\n')}\n\n`;
      }
    }

    prompt += `กรุณาคำนวณและตอบกลับในรูปแบบ JSON เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "daily_calories": {
    "Sun": 0,
    "Mon": 0,
    "Tue": 0,
    "Wed": 0,
    "Thu": 0,
    "Fri": 0,
    "Sat": 0
  },
  "weekly_total": 0,
  "meal_details": {
    "Sun": {
      "breakfast": 0,
      "lunch": 0,
      "dinner": 0,
      "snack": 0
    }
  }
}

กรุณาตอบกลับเฉพาะ JSON เท่านั้น ไม่ต้องมีข้อความอื่น`;

    // เรียก Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON จาก response
    let caloriesData;
    try {
      // ลบ markdown code blocks ถ้ามี
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      caloriesData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      throw new Error('ไม่สามารถแปลงผลลัพธ์จาก AI ได้ กรุณาลองใหม่อีกครั้ง');
    }

    // ตรวจสอบและคำนวณ warnings
    const warnings = [];
    const dailyCalories = caloriesData.daily_calories || {};
    const weeklyTotal = caloriesData.weekly_total || 0;

    if (calorieLimit) {
      for (const day of DAYS) {
        const dayCalories = dailyCalories[day] || 0;
        if (dayCalories > calorieLimit) {
          const excess = dayCalories - calorieLimit;
          warnings.push({
            day: day,
            calories: dayCalories,
            limit: calorieLimit,
            excess: excess,
            message: `${day}: เกิน ${excess} แคลอรี่ (${dayCalories}/${calorieLimit})`
          });
        }
      }
    }

    res.json({
      total_calories: weeklyTotal,
      daily_calories: dailyCalories,
      meal_details: caloriesData.meal_details || {},
      weekly_total: weeklyTotal,
      calorie_limit: calorieLimit,
      warnings: warnings,
      has_warnings: warnings.length > 0
    });

  } catch (error) {
    console.error('Error calculating calories:', error);
    const errorMsg = error.message || 'เกิดข้อผิดพลาดในการคำนวณแคลอรี่';
    res.status(500).json({ 
      error: errorMsg,
      details: error.toString()
    });
  }
});

// GET /api/weekly-meal-plan/shopping-list - สร้างรายการซื้อของจาก weekly meal plan
router.get('/weekly-meal-plan/shopping-list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึง weekly meal plan พร้อม day และ meal_type
    const { data: planItems, error: planError } = await supabase
      .from('WeeklyMealPlan')
      .select('menu_id, day, meal_type')
      .eq('user_id', userId)
      .order('day')
      .order('meal_type');

    if (planError) throw planError;

    if (!planItems || planItems.length === 0) {
      return res.json({});
    }

    // ดึง menu_id ทั้งหมดที่ไม่ซ้ำ
    const uniqueMenuIds = [...new Set(planItems.map(item => item.menu_id))];

    // ดึงข้อมูลเมนูและส่วนผสม
    const { data: menus, error: menusError } = await supabase
      .from('Menu')
      .select(`
        menu_id,
        menu_recipe,
        MenuIngredient (
          Ingredient:ingredient_id (
            ingredient_id,
            ingredient_name
          )
        )
      `)
      .in('menu_id', uniqueMenuIds);

    if (menusError) throw menusError;

    // สร้าง map สำหรับเก็บข้อมูลเมนู
    const menuMap = new Map();
    for (const menu of menus || []) {
      menuMap.set(menu.menu_id, menu);
    }

    // สร้างรายการซื้อของแยกตามวัน
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const shoppingListByDay = {};

    for (const day of DAYS) {
      shoppingListByDay[day] = [];
    }

    // จัดกลุ่ม plan items ตามวัน
    const planByDay = {};
    for (const item of planItems) {
      if (!planByDay[item.day]) {
        planByDay[item.day] = [];
      }
      planByDay[item.day].push(item);
    }

    // สร้างรายการซื้อของสำหรับแต่ละวัน
    for (const day of DAYS) {
      if (!planByDay[day] || planByDay[day].length === 0) {
        continue;
      }

      const ingredientMap = new Map();

      for (const planItem of planByDay[day]) {
        const menu = menuMap.get(planItem.menu_id);
        if (!menu) continue;

        // ถ้ามี MenuIngredient ใช้ข้อมูลจากนั้น
        if (menu.MenuIngredient && menu.MenuIngredient.length > 0) {
          for (const mi of menu.MenuIngredient) {
            if (mi.Ingredient) {
              // ลบจำนวนออกจากชื่อส่วนผสม
              const cleanedName = removeQuantityFromIngredientName(mi.Ingredient.ingredient_name);
              const key = cleanedName.toLowerCase();
              if (!ingredientMap.has(key)) {
                ingredientMap.set(key, {
                  name: cleanedName,
                  count: 0
                });
              }
              ingredientMap.get(key).count++;
            }
          }
        }
      }

      const dayShoppingList = Array.from(ingredientMap.values())
        .map(item => ({
          name: item.name,
          measure: '' // ไม่แสดงจำนวนครั้งแม้จะซ้ำกัน
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (dayShoppingList.length > 0) {
        shoppingListByDay[day] = dayShoppingList;
      }
    }

    res.json(shoppingListByDay);
  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายการซื้อของ' });
  }
});

module.exports = router;

