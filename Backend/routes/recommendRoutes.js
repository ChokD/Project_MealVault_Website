const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/menus/recommend', async (req, res) => {
  const { userIngredients } = req.body; // e.g., ["หมู", "พริก"]

  if (!userIngredients || userIngredients.length === 0) {
    return res.status(400).json({ message: 'กรุณาระบุวัตถุดิบที่คุณมี' });
  }

  try {
    const sql = `
      SELECT 
        m.menu_id, 
        m.menu_name,
        m.menu_image, 
        i.ingredient_name 
      FROM Menu AS m
      JOIN MenuIngredient AS mi ON m.menu_id = mi.menu_id
      JOIN Ingredient AS i ON mi.ingredient_id = i.ingredient_id
    `;
    const [allMenuRequirements] = await db.query(sql);

    const menuRequirements = allMenuRequirements.reduce((acc, row) => {
      if (!acc[row.menu_id]) {
        acc[row.menu_id] = { 
          menu_id: row.menu_id, 
          menu_name: row.menu_name, 
          menu_image: row.menu_image,
          required: [] 
        };
      }
      acc[row.menu_id].required.push(row.ingredient_name);
      return acc;
    }, {});

    // --- ตรรกะการค้นหาที่แก้ไขใหม่ ---
    const recommendedMenus = [];
    for (const menuId in menuRequirements) {
      const menu = menuRequirements[menuId];
      
      // ตรวจสอบว่า "ทุก" วัตถุดิบที่เมนูต้องการ (required)
      // มี "อย่างน้อยหนึ่ง" วัตถุดิบของผู้ใช้ (userIngredients) ที่เป็นส่วนหนึ่งของมัน
      const canMake = menu.required.every(requiredIngredient =>
        userIngredients.some(userIngredient => 
          requiredIngredient.toLowerCase().includes(userIngredient.toLowerCase())
        )
      );
      
      if (canMake) {
        recommendedMenus.push({ 
          menu_id: menu.menu_id, 
          menu_name: menu.menu_name,
          menu_image: menu.menu_image
        });
      }
    }
    // --- จบส่วนที่แก้ไข ---

    res.json(recommendedMenus);

  } catch (error) {
    console.error('Error recommending menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแนะนำเมนู' });
  }
});

module.exports = router;