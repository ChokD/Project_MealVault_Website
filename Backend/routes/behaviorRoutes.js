const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// Test endpoint
router.get('/behavior/test', (req, res) => {
  res.json({ 
    message: 'Behavior routes are working!', 
    timestamp: new Date().toISOString() 
  });
});

// Optional auth middleware: decode token if provided, but don't fail when missing
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
    } catch (error) {
      console.warn('Behavior route received invalid token:', error.message);
    }
  }
  next();
};

const resolveUserId = (req) => {
  if (req.user?.id) return req.user.id;
  if (req.body?.user_id) return req.body.user_id;
  if (req.query?.user_id) return req.query.user_id;
  return null;
};

// Track menu view
router.post('/behavior/menu/view', optionalAuth, async (req, res) => {
  const { menu_id } = req.body;
  const user_id = resolveUserId(req);

  if (!menu_id) {
    return res.status(400).json({ message: 'menu_id is required' });
  }
  if (!user_id) {
    return res.status(401).json({ message: 'user_id is required' });
  }

  try {
    // Check if view already exists
    const { data: existing } = await supabase
      .from('UserMenuView')
      .select('id, view_count')
      .eq('user_id', user_id)
      .eq('menu_id', menu_id)
      .single();

    if (existing) {
      // Increment view count
      const { error } = await supabase
        .from('UserMenuView')
        .update({ 
          view_count: existing.view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Create new view record
      const { error } = await supabase
        .from('UserMenuView')
        .insert([{ user_id, menu_id }]);
      
      if (error) throw error;
    }

    // Update ingredient preferences based on menu ingredients
    await updateIngredientPreferences(user_id, menu_id, 0.1); // Small positive score for viewing

    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('Error tracking menu view:', error);
    res.status(500).json({ message: 'Failed to track view' });
  }
});

// Track post view
router.post('/behavior/post/view', optionalAuth, async (req, res) => {
  const { cpost_id } = req.body;
  const user_id = resolveUserId(req);

  if (!cpost_id) {
    return res.status(400).json({ message: 'cpost_id is required' });
  }
  if (!user_id) {
    return res.status(401).json({ message: 'user_id is required' });
  }

  try {
    // Check if view already exists
    const { data: existing } = await supabase
      .from('UserPostView')
      .select('id, view_count')
      .eq('user_id', user_id)
      .eq('cpost_id', cpost_id)
      .single();

    if (existing) {
      // Increment view count
      const { error } = await supabase
        .from('UserPostView')
        .update({ 
          view_count: existing.view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Create new view record
      const { error } = await supabase
        .from('UserPostView')
        .insert([{ user_id, cpost_id }]);
      
      if (error) throw error;
    }

    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('Error tracking post view:', error);
    res.status(500).json({ message: 'Failed to track view' });
  }
});

// Track search
router.post('/behavior/search', optionalAuth, async (req, res) => {
  const { search_query, search_type, result_count } = req.body;
  const user_id = resolveUserId(req);

  if (!search_query || !search_type) {
    return res.status(400).json({ message: 'search_query and search_type are required' });
  }
  if (!user_id) {
    return res.status(401).json({ message: 'user_id is required' });
  }

  try {
    const { error } = await supabase
      .from('UserSearchHistory')
      .insert([{
        user_id,
        search_query,
        search_type,
        result_count: result_count || 0
      }]);

    if (error) throw error;

    res.json({ message: 'Search tracked successfully' });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ message: 'Failed to track search' });
  }
});

// Helper function to update ingredient preferences
async function updateIngredientPreferences(user_id, menu_id, score_delta) {
  try {
    // Get menu details
    const { data: menu } = await supabase
      .from('Menu')
      .select('menu_recipe, menu_description')
      .eq('menu_id', menu_id)
      .single();

    if (!menu) return;

    // Extract ingredients from recipe and description
    const text = `${menu.menu_recipe || ''} ${menu.menu_description || ''}`.toLowerCase();
    
    // Common Thai ingredients to track
    const commonIngredients = [
      'หมู', 'ไก่', 'เนื้อ', 'ปลา', 'กุ้ง', 'หอย', 'ปู', 'ไข่',
      'ผัก', 'ผักกาด', 'ผักชี', 'กะหล่ำปลี', 'มะเขือเทศ', 'แครอท', 'หัวหอม', 'กระเทียม',
      'พริก', 'พริกไทย', 'ขิง', 'ข่า', 'ตะไคร้', 'ใบมะกรูด',
      'น้ำตาล', 'เกลือ', 'น้ำปลา', 'ซีอิ๊ว', 'น้ำมันหอย',
      'ข้าว', 'เส้น', 'เส้นหมี่', 'เส้นใหญ่', 'วุ้นเส้น'
    ];

    // Find which ingredients are mentioned
    const mentionedIngredients = commonIngredients.filter(ing => text.includes(ing));

    // Update preferences for each mentioned ingredient
    for (const ingredient_name of mentionedIngredients) {
      const { data: existing } = await supabase
        .from('UserIngredientPreference')
        .select('id, preference_score, interaction_count')
        .eq('user_id', user_id)
        .eq('ingredient_name', ingredient_name)
        .single();

      if (existing) {
        const newScore = existing.preference_score + score_delta;
        const newCount = existing.interaction_count + 1;
        
        await supabase
          .from('UserIngredientPreference')
          .update({
            preference_score: newScore,
            interaction_count: newCount,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('UserIngredientPreference')
          .insert([{
            user_id,
            ingredient_name,
            preference_score: score_delta,
            interaction_count: 1
          }]);
      }
    }

    // Update category preference
    const { data: menuWithCategory } = await supabase
      .from('Menu')
      .select('category_id')
      .eq('menu_id', menu_id)
      .single();

    if (menuWithCategory?.category_id) {
      await updateCategoryPreference(user_id, menuWithCategory.category_id, score_delta);
    }
  } catch (error) {
    console.error('Error updating ingredient preferences:', error);
  }
}

// Helper function to update category preferences
async function updateCategoryPreference(user_id, category_id, score_delta) {
  try {
    const { data: existing } = await supabase
      .from('UserCategoryPreference')
      .select('id, preference_score, interaction_count')
      .eq('user_id', user_id)
      .eq('category_id', category_id)
      .single();

    if (existing) {
      const newScore = existing.preference_score + score_delta;
      const newCount = existing.interaction_count + 1;
      
      await supabase
        .from('UserCategoryPreference')
        .update({
          preference_score: newScore,
          interaction_count: newCount,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('UserCategoryPreference')
        .insert([{
          user_id,
          category_id,
          preference_score: score_delta,
          interaction_count: 1
        }]);
    }
  } catch (error) {
    console.error('Error updating category preference:', error);
  }
}

// Track when user likes a menu (stronger positive signal)
router.post('/behavior/menu/like', optionalAuth, async (req, res) => {
  const { menu_id } = req.body;
  const user_id = resolveUserId(req);

  try {
    if (!user_id) {
      return res.status(401).json({ message: 'user_id is required' });
    }
    await updateIngredientPreferences(user_id, menu_id, 0.5); // Stronger positive score for liking
    res.json({ message: 'Preference updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update preference' });
  }
});

// Track when user adds menu to meal plan (strong positive signal)
router.post('/behavior/menu/meal-plan', optionalAuth, async (req, res) => {
  const { menu_id } = req.body;
  const user_id = resolveUserId(req);

  try {
    if (!user_id) {
      return res.status(401).json({ message: 'user_id is required' });
    }
    await updateIngredientPreferences(user_id, menu_id, 1.0); // Strong positive score for meal planning
    res.json({ message: 'Preference updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update preference' });
  }
});

module.exports = router;
module.exports.updateIngredientPreferences = updateIngredientPreferences;
