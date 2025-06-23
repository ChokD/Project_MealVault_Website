const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/menus/recommend', async (req, res) => {
  // 1. รับรายการ 'ชื่อ' วัตถุดิบที่ผู้ใช้มีจาก Request Body
  const { userIngredients } = req.body; // e.g., ["หมูสับ", "พริก", "ใบกะเพรา", "กระเทียม"]

  if (!userIngredients || userIngredients.length === 0) {
    return res.status(400).json({ message: 'กรุณาระบุวัตถุดิบที่คุณมี' });
  }

  try {
    // 2. ดึงข้อมูลเมนูทั้งหมดพร้อมวัตถุดิบที่ต้องใช้จากฐานข้อมูล
    const sql = `
      SELECT 
        m.menu_id, 
        m.menu_name, 
        i.ingredient_name 
      FROM Menu AS m
      JOIN MenuIngredient AS mi ON m.menu_id = mi.menu_id
      JOIN Ingredient AS i ON mi.ingredient_id = i.ingredient_id
    `;
    const [allMenuRequirements] = await db.query(sql);

    // 3. จัดกลุ่มข้อมูลให้อยู่ในรูปแบบ { menu_id: [ingredient1, ingredient2] }
    const menuRequirements = allMenuRequirements.reduce((acc, row) => {
      if (!acc[row.menu_id]) {
        acc[row.menu_id] = { menu_id: row.menu_id, menu_name: row.menu_name, required: [] };
      }
      acc[row.menu_id].required.push(row.ingredient_name);
      return acc;
    }, {});

    // 4. วนลูปเพื่อหาเมนูที่สามารถทำได้
    const recommendedMenus = [];
    for (const menuId in menuRequirements) {
      const menu = menuRequirements[menuId];
      // ตรวจสอบว่าวัตถุดิบที่ต้องใช้ทั้งหมดของเมนูนี้ อยู่ในวัตถุดิบที่ผู้ใช้มีหรือไม่
      const canMake = menu.required.every(reqIngredient => userIngredients.includes(reqIngredient));

      if (canMake) {
        recommendedMenus.push({ menu_id: menu.menu_id, menu_name: menu.menu_name });
      }
    }

    res.json(recommendedMenus);

  } catch (error) {
    console.error('Error recommending menus:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแนะนำเมนู' });
  }
});

module.exports = router;