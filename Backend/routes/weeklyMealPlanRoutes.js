const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

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

// GET /api/weekly-meal-plan/shopping-list - สร้างรายการของซื้อจาก weekly meal plan
router.get('/weekly-meal-plan/shopping-list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึง weekly meal plan
    const { data: planItems, error: planError } = await supabase
      .from('WeeklyMealPlan')
      .select('menu_id')
      .eq('user_id', userId);

    if (planError) throw planError;

    if (!planItems || planItems.length === 0) {
      return res.json([]);
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

    // สร้างรายการของซื้อ
    const ingredientMap = new Map();

    for (const menu of menus || []) {
      // ถ้ามี MenuIngredient ใช้ข้อมูลจากนั้น
      if (menu.MenuIngredient && menu.MenuIngredient.length > 0) {
        for (const mi of menu.MenuIngredient) {
          if (mi.Ingredient) {
            const key = mi.Ingredient.ingredient_name.toLowerCase();
            if (!ingredientMap.has(key)) {
              ingredientMap.set(key, {
                name: mi.Ingredient.ingredient_name,
                count: 0
              });
            }
            ingredientMap.get(key).count++;
          }
        }
      } else if (menu.menu_recipe) {
        // ถ้าไม่มี MenuIngredient แต่มี menu_recipe ให้พยายาม parse (แบบง่ายๆ)
        // ในกรณีนี้เราจะส่งกลับ menu_recipe ให้ frontend จัดการเอง
        // หรืออาจจะต้อง parse จาก recipe text
      }
    }

    const shoppingList = Array.from(ingredientMap.values())
      .map(item => ({
        name: item.name,
        measure: item.count > 1 ? `${item.count} ครั้ง` : ''
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json(shoppingList);
  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายการของซื้อ' });
  }
});

module.exports = router;

