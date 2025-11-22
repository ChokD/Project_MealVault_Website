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
 
// Suggest menus by liked and allergic ingredients
router.post('/menus/suggest', async (req, res) => {
  const { likes = [], allergies = [] } = req.body;

  try {
    const { data: menus, error } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_image, menu_recipe, menu_description');
    if (error) throw error;

    const normalize = (text) => String(text || '').toLowerCase();
    const likeTerms = Array.isArray(likes) ? likes.map(v => normalize(v)).filter(Boolean) : [];
    const allergyTerms = Array.isArray(allergies) ? allergies.map(v => normalize(v)).filter(Boolean) : [];

    const scored = (menus || [])
      .map(m => {
        const hay = normalize(`${m.menu_recipe || ''} ${m.menu_description || ''} ${m.menu_name || ''}`);
        const hasAllergy = allergyTerms.some(term => hay.includes(term));
        if (hasAllergy) return null;
        const score = likeTerms.reduce((acc, term) => acc + (hay.includes(term) ? 1 : 0), 0);
        return { menu_id: m.menu_id, menu_name: m.menu_name, menu_image: m.menu_image, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const top = scored.length > 0 ? scored.filter(x => x.score === scored[0].score) : [];
    const pool = (top.length >= 3 ? top : scored).slice(0, 20);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const result = shuffled.slice(0, 3).map(({ menu_id, menu_name, menu_image }) => ({ menu_id, menu_name, menu_image }));

    res.json(result);
  } catch (error) {
    console.error('Error suggesting menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแนะนำเมนู' });
  }
});