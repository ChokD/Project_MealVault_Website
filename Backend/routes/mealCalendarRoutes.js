const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/meal-calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/meal-calendar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;
    let query = supabase.from('MealCalendar').select('*').eq('user_id', userId).order('meal_date');
    if (from) query = query.gte('meal_date', from);
    if (to) query = query.lte('meal_date', to);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching meal calendar:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงปฏิทินเมนู' });
  }
});

// POST /api/meal-calendar
router.post('/meal-calendar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { meal_date, meal_type, menu_id, note } = req.body;
    const newItem = { user_id: userId, meal_date, meal_type, menu_id, note };
    const { data, error } = await supabase.from('MealCalendar').insert([newItem]).select();
    if (error) throw error;
    res.status(201).json(data && data[0] ? data[0] : newItem);
  } catch (error) {
    console.error('Error creating meal calendar item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายการปฏิทิน' });
  }
});

// PUT /api/meal-calendar/:id
router.put('/meal-calendar/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { meal_date, meal_type, menu_id, note } = req.body;
    const { data, error } = await supabase
      .from('MealCalendar')
      .update({ meal_date, meal_type, menu_id, note })
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ message: 'ไม่พบรายการ' });
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating meal calendar item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขรายการปฏิทิน' });
  }
});

// DELETE /api/meal-calendar/:id
router.delete('/meal-calendar/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const { error } = await supabase
      .from('MealCalendar')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    res.json({ message: 'ลบรายการสำเร็จ' });
  } catch (error) {
    console.error('Error deleting meal calendar item:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรายการปฏิทิน' });
  }
});

module.exports = router;


