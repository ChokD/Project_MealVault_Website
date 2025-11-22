const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

router.post('/menus/recommend', async (req, res) => {
  const { userIngredients } = req.body; // e.g., ["หมู", "พริก"]

  if (!userIngredients || userIngredients.length === 0) {
    return res.status(400).json({ message: 'กรุณาระบุวัตถุดิบที่คุณมี' });
  }

  try {
    // ไม่มีตาราง Ingredient/Mapping ใน Supabase schema ปัจจุบัน
    // จึงใช้การแม็ตช์ข้อความจาก menu_recipe/menu_description แทน
    const { data: menus, error } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_image, menu_recipe, menu_description');
    if (error) throw error;

    const results = (menus || []).filter(m => {
      const hay = `${m.menu_recipe || ''} ${m.menu_description || ''}`.toLowerCase();
      // ต้องพบวัตถุดิบของผู้ใช้ทุกตัวในข้อความเมนู
      return userIngredients.every(ing => hay.includes(String(ing).toLowerCase()));
    }).map(m => ({ menu_id: m.menu_id, menu_name: m.menu_name, menu_image: m.menu_image }));

    res.json(results);

  } catch (error) {
    console.error('Error recommending menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแนะนำเมนู' });
  }
});

module.exports = router;