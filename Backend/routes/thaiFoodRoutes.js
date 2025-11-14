const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/thai-food/filter.php?c=category - ดึงเมนูตามหมวดหมู่ (เหมือน TheMealDB)
// GET /api/thai-food/filter.php?i=ingredient - ดึงเมนูตามวัตถุดิบ (เหมือน TheMealDB)
router.get('/thai-food/filter.php', async (req, res) => {
  try {
    const { c, i } = req.query; // category หรือ ingredient
    
    // ถ้ามี ingredient ให้ค้นหาตามวัตถุดิบ
    if (i) {
      // หาวัตถุดิบที่ตรงกับคำค้นหา
      const { data: ingredients } = await supabase
        .from('Ingredient')
        .select('ingredient_id')
        .ilike('ingredient_name', `%${i}%`);

      if (!ingredients || ingredients.length === 0) {
        return res.json({ meals: [] });
      }

      const ingredientIds = ingredients.map(ing => ing.ingredient_id);

      // หาเมนูที่ใช้วัตถุดิบเหล่านี้
      const { data: menuIngredients } = await supabase
        .from('MenuIngredient')
        .select('menu_id')
        .in('ingredient_id', ingredientIds);

      if (!menuIngredients || menuIngredients.length === 0) {
        return res.json({ meals: [] });
      }

      const menuIds = [...new Set(menuIngredients.map(mi => mi.menu_id))];

      // ดึงข้อมูลเมนู
      const { data: menus, error } = await supabase
        .from('Menu')
        .select('menu_id, menu_name, menu_image')
        .in('menu_id', menuIds);

      if (error) throw error;

      // แปลงรูปแบบให้เหมือน TheMealDB
      const meals = (menus || []).map(menu => ({
        idMeal: menu.menu_id,
        strMeal: menu.menu_name,
        strMealThumb: menu.menu_image
      }));

      return res.json({ meals });
    }
    
    // ถ้าไม่มี ingredient ให้ค้นหาตาม category
    let query = supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_image, category_id');

    // ถ้ามีหมวดหมู่ ให้กรองตามหมวดหมู่
    if (c && c !== 'All') {
      // หา category_id จากชื่อหมวดหมู่
      const { data: category } = await supabase
        .from('Category')
        .select('category_id')
        .ilike('category_name', `%${c}%`)
        .limit(1);

      if (category && category.length > 0) {
        query = query.eq('category_id', category[0].category_id);
      }
    }

    const { data: menus, error } = await query;
    
    if (error) throw error;

    // แปลงรูปแบบให้เหมือน TheMealDB
    const meals = (menus || []).map(menu => ({
      idMeal: menu.menu_id,
      strMeal: menu.menu_name,
      strMealThumb: menu.menu_image
    }));

    res.json({ meals });

  } catch (error) {
    console.error('Error fetching thai food:', error);
    res.status(500).json({ meals: null });
  }
});

// GET /api/thai-food/lookup.php?i=id - ดึงรายละเอียดเมนู (เหมือน TheMealDB)
router.get('/thai-food/lookup.php', async (req, res) => {
  try {
    const { i } = req.query; // id
    
    if (!i) {
      return res.json({ meals: null });
    }

    // ดึงข้อมูลเมนู
    const { data: menus, error } = await supabase
      .from('Menu')
      .select('*, category:Category(category_name)')
      .eq('menu_id', i)
      .limit(1);

    if (error) throw error;

    if (!menus || menus.length === 0) {
      return res.json({ meals: null });
    }

    const menu = menus[0];

    // ดึงวัตถุดิบ
    const { data: menuIngredients } = await supabase
      .from('MenuIngredient')
      .select('ingredient:Ingredient(ingredient_name)')
      .eq('menu_id', i);

    // แปลงวัตถุดิบเป็นรูปแบบ TheMealDB (strIngredient1, strMeasure1, ...)
    const ingredients = {};
    if (menuIngredients) {
      menuIngredients.forEach((mi, index) => {
        if (mi.ingredient && mi.ingredient.ingredient_name) {
          const ingName = mi.ingredient.ingredient_name;
          // แยกชื่อและปริมาณ (เช่น "กุ้งนาง 4 ตัว" -> "กุ้งนาง" และ "4 ตัว")
          // ใช้ regex ที่ดีกว่าเพื่อแยกชื่อวัตถุดิบและปริมาณ
          // รองรับ: ตัวเลขไทย/อังกฤษ, เศษส่วน (1/2), ทศนิยม, เครื่องหมายต่างๆ
          const match = ingName.match(/^(.+?)\s+([0-9๐-๙\/\s\-\.]+.*?)$/);
          if (match) {
            ingredients[`strIngredient${index + 1}`] = match[1].trim();
            ingredients[`strMeasure${index + 1}`] = match[2].trim();
          } else {
            // ถ้าไม่พบรูปแบบ ให้ใช้ชื่อทั้งหมดเป็น ingredient
            ingredients[`strIngredient${index + 1}`] = ingName;
            ingredients[`strMeasure${index + 1}`] = '';
          }
        }
      });
    }

    // แปลงข้อมูลเมนูเป็นรูปแบบ TheMealDB
    const meal = {
      idMeal: menu.menu_id,
      strMeal: menu.menu_name,
      strDrinkAlternate: null,
      strCategory: menu.category?.category_name || 'Thai Food',
      strArea: 'Thai',
      strInstructions: menu.menu_recipe || menu.menu_description || '',
      strMealThumb: menu.menu_image || '',
      strTags: null,
      strYoutube: null,
      strSource: menu.menu_source || null,
      strSourceUrl: menu.menu_source_url || null,
      strIngredient1: ingredients.strIngredient1 || null,
      strIngredient2: ingredients.strIngredient2 || null,
      strIngredient3: ingredients.strIngredient3 || null,
      strIngredient4: ingredients.strIngredient4 || null,
      strIngredient5: ingredients.strIngredient5 || null,
      strIngredient6: ingredients.strIngredient6 || null,
      strIngredient7: ingredients.strIngredient7 || null,
      strIngredient8: ingredients.strIngredient8 || null,
      strIngredient9: ingredients.strIngredient9 || null,
      strIngredient10: ingredients.strIngredient10 || null,
      strIngredient11: ingredients.strIngredient11 || null,
      strIngredient12: ingredients.strIngredient12 || null,
      strIngredient13: ingredients.strIngredient13 || null,
      strIngredient14: ingredients.strIngredient14 || null,
      strIngredient15: ingredients.strIngredient15 || null,
      strIngredient16: ingredients.strIngredient16 || null,
      strIngredient17: ingredients.strIngredient17 || null,
      strIngredient18: ingredients.strIngredient18 || null,
      strIngredient19: ingredients.strIngredient19 || null,
      strIngredient20: ingredients.strIngredient20 || null,
      strMeasure1: ingredients.strMeasure1 || null,
      strMeasure2: ingredients.strMeasure2 || null,
      strMeasure3: ingredients.strMeasure3 || null,
      strMeasure4: ingredients.strMeasure4 || null,
      strMeasure5: ingredients.strMeasure5 || null,
      strMeasure6: ingredients.strMeasure6 || null,
      strMeasure7: ingredients.strMeasure7 || null,
      strMeasure8: ingredients.strMeasure8 || null,
      strMeasure9: ingredients.strMeasure9 || null,
      strMeasure10: ingredients.strMeasure10 || null,
      strMeasure11: ingredients.strMeasure11 || null,
      strMeasure12: ingredients.strMeasure12 || null,
      strMeasure13: ingredients.strMeasure13 || null,
      strMeasure14: ingredients.strMeasure14 || null,
      strMeasure15: ingredients.strMeasure15 || null,
      strMeasure16: ingredients.strMeasure16 || null,
      strMeasure17: ingredients.strMeasure17 || null,
      strMeasure18: ingredients.strMeasure18 || null,
      strMeasure19: ingredients.strMeasure19 || null,
      strMeasure20: ingredients.strMeasure20 || null,
      strSource: null,
      strImageSource: null,
      strCreativeCommonsConfirmed: null,
      dateModified: null
    };

    // เพิ่มวัตถุดิบที่เหลือ (ถ้ามีมากกว่า 20)
    Object.keys(ingredients).forEach(key => {
      if (!meal[key]) {
        meal[key] = ingredients[key];
      }
    });

    res.json({ meals: [meal] });

  } catch (error) {
    console.error('Error fetching thai food details:', error);
    res.status(500).json({ meals: null });
  }
});

// GET /api/thai-food/categories.php - ดึงหมวดหมู่ทั้งหมด
router.get('/thai-food/categories.php', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('Category')
      .select('category_id, category_name')
      .order('category_name');

    if (error) throw error;

    const categoriesList = (categories || []).map(cat => ({
      idCategory: cat.category_id,
      strCategory: cat.category_name
    }));

    res.json({ categories: categoriesList });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ categories: [] });
  }
});

module.exports = router;

