const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get AI-powered recommendations based on user behavior
router.get('/ai/recommendations', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  try {
    // Fetch user behavior data
    const behaviorData = await getUserBehaviorData(user_id);
    
    // Get user profile preferences
    const { data: userProfile } = await supabase
      .from('User')
      .select('allergies, favorite_foods, calorie_limit')
      .eq('user_id', user_id)
      .single();

    // Generate recommendations using AI
    const recommendations = await generateAIRecommendations(behaviorData, userProfile);

    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
});

async function getUserBehaviorData(user_id) {
  try {
    // Get viewed menus
    const { data: viewedMenus } = await supabase
      .from('UserMenuView')
      .select(`
        menu_id,
        view_count,
        last_viewed_at,
        Menu (menu_name, menu_description, category_id)
      `)
      .eq('user_id', user_id)
      .order('view_count', { ascending: false })
      .limit(20);

    // Get liked menus
    const { data: likedMenus } = await supabase
      .from('MenuLike')
      .select(`
        menu_id,
        Menu (menu_name, menu_description, category_id)
      `)
      .eq('user_id', user_id)
      .limit(20);

    // Get ingredient preferences
    const { data: ingredientPrefs } = await supabase
      .from('UserIngredientPreference')
      .select('ingredient_name, preference_score')
      .eq('user_id', user_id)
      .order('preference_score', { ascending: false });

    // Get category preferences
    const { data: categoryPrefs } = await supabase
      .from('UserCategoryPreference')
      .select(`
        category_id,
        preference_score,
        Category (category_name)
      `)
      .eq('user_id', user_id)
      .order('preference_score', { ascending: false });

    // Get recent searches
    const { data: recentSearches } = await supabase
      .from('UserSearchHistory')
      .select('search_query, search_type')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get meal plan history
    const { data: mealPlanHistory } = await supabase
      .from('WeeklyMealPlan')
      .select(`
        menu_id,
        Menu (menu_name, menu_description)
      `)
      .eq('user_id', user_id)
      .limit(30);

    return {
      viewedMenus,
      likedMenus,
      ingredientPrefs,
      categoryPrefs,
      recentSearches,
      mealPlanHistory
    };
  } catch (error) {
    console.error('Error fetching behavior data:', error);
    return {};
  }
}

async function generateAIRecommendations(behaviorData, userProfile) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback to rule-based recommendations if no AI key
      return await getRuleBasedRecommendations(behaviorData, userProfile);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare context for AI
    const likedIngredients = (behaviorData.ingredientPrefs || [])
      .filter(p => p.preference_score > 0)
      .slice(0, 10)
      .map(p => p.ingredient_name);

    const dislikedIngredients = (behaviorData.ingredientPrefs || [])
      .filter(p => p.preference_score < 0)
      .slice(0, 10)
      .map(p => p.ingredient_name);

    const preferredCategories = (behaviorData.categoryPrefs || [])
      .slice(0, 5)
      .map(p => p.Category?.category_name)
      .filter(Boolean);

    const recentSearchTerms = (behaviorData.recentSearches || [])
      .map(s => s.search_query)
      .slice(0, 5);

    const prompt = `
      You are a Thai food recommendation system. Based on the user's behavior data, recommend 10 menu items.
      
      User Profile:
      - Allergies: ${userProfile?.allergies || 'None'}
      - Favorite Foods: ${userProfile?.favorite_foods || 'Not specified'}
      - Calorie Limit: ${userProfile?.calorie_limit || 'Not specified'}
      
      User Behavior:
      - Frequently viewed/liked ingredients: ${likedIngredients.join(', ') || 'None'}
      - Avoided ingredients: ${dislikedIngredients.join(', ') || 'None'}
      - Preferred categories: ${preferredCategories.join(', ') || 'None'}
      - Recent searches: ${recentSearchTerms.join(', ') || 'None'}
      
      Based on this data, suggest 10 Thai menu items that would appeal to this user.
      Consider their preferences, avoid their dislikes and allergies.
      
      Format your response as a JSON array with this structure:
      [
        {
          "menu_name": "Name in Thai",
          "reason": "Brief explanation why this matches user preferences",
          "matching_preferences": ["ingredient1", "category1"],
          "estimated_calories": number
        }
      ]
      
      Return ONLY the JSON array, no other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        
        // Find matching menus in database
        const menuNames = recommendations.map(r => r.menu_name);
        const { data: menus } = await supabase
          .from('Menu')
          .select('menu_id, menu_name, menu_image, menu_description')
          .in('menu_name', menuNames);

        // Combine AI recommendations with actual menu data
        const enrichedRecommendations = recommendations.map(rec => {
          const menu = menus?.find(m => m.menu_name === rec.menu_name);
          return {
            ...rec,
            menu_id: menu?.menu_id,
            menu_image: menu?.menu_image,
            menu_description: menu?.menu_description,
            exists_in_db: !!menu
          };
        });

        return {
          recommendations: enrichedRecommendations,
          method: 'ai_behavior_based'
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Fallback if AI fails
    return await getRuleBasedRecommendations(behaviorData, userProfile);
  } catch (error) {
    console.error('Error with AI recommendations:', error);
    return await getRuleBasedRecommendations(behaviorData, userProfile);
  }
}

async function getRuleBasedRecommendations(behaviorData, userProfile) {
  try {
    // Get all menus
    const { data: allMenus } = await supabase
      .from('Menu')
      .select('menu_id, menu_name, menu_image, menu_description, menu_recipe, category_id');

    if (!allMenus || allMenus.length === 0) {
      return { recommendations: [], method: 'rule_based' };
    }

    // Score each menu based on behavior
    const scoredMenus = allMenus.map(menu => {
      let score = 0;
      const reasons = [];

      // Check ingredient preferences
      const menuText = `${menu.menu_recipe || ''} ${menu.menu_description || ''}`.toLowerCase();
      
      (behaviorData.ingredientPrefs || []).forEach(pref => {
        if (menuText.includes(pref.ingredient_name.toLowerCase())) {
          score += pref.preference_score;
          if (pref.preference_score > 0) {
            reasons.push(`Contains liked ingredient: ${pref.ingredient_name}`);
          }
        }
      });

      // Check category preferences
      const categoryPref = (behaviorData.categoryPrefs || [])
        .find(cp => cp.category_id === menu.category_id);
      if (categoryPref) {
        score += categoryPref.preference_score * 2; // Weight category preference higher
        reasons.push(`Preferred category: ${categoryPref.Category?.category_name}`);
      }

      // Check if frequently viewed
      const viewData = (behaviorData.viewedMenus || [])
        .find(vm => vm.menu_id === menu.menu_id);
      if (viewData) {
        score -= viewData.view_count * 0.1; // Slightly penalize already viewed items
      }

      // Check if already in meal plan
      const inMealPlan = (behaviorData.mealPlanHistory || [])
        .some(mp => mp.menu_id === menu.menu_id);
      if (inMealPlan) {
        score -= 0.5; // Penalize items already in meal plan
      }

      // Check allergies
      if (userProfile?.allergies) {
        const allergies = userProfile.allergies.toLowerCase().split(',').map(a => a.trim());
        const hasAllergy = allergies.some(allergy => menuText.includes(allergy));
        if (hasAllergy) {
          score = -1000; // Heavily penalize items with allergens
          reasons.push('Contains allergen');
        }
      }

      return {
        ...menu,
        score,
        reasons
      };
    });

    // Sort by score and take top 10
    const recommendations = scoredMenus
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score, reasons, ...menu }) => ({
        menu_id: menu.menu_id,
        menu_name: menu.menu_name,
        menu_image: menu.menu_image,
        menu_description: menu.menu_description,
        reason: reasons.join(', ') || 'Based on general preferences',
        matching_preferences: reasons,
        exists_in_db: true
      }));

    return {
      recommendations,
      method: 'rule_based'
    };
  } catch (error) {
    console.error('Error in rule-based recommendations:', error);
    return { recommendations: [], method: 'rule_based', error: true };
  }
}

// Get personalized menu suggestions for specific meals
router.post('/ai/meal-suggestions', authMiddleware, async (req, res) => {
  const { meal_type, day_of_week } = req.body;
  const user_id = req.user.id;

  try {
    const behaviorData = await getUserBehaviorData(user_id);
    const { data: userProfile } = await supabase
      .from('User')
      .select('allergies, favorite_foods, calorie_limit')
      .eq('user_id', user_id)
      .single();

    if (!process.env.GEMINI_API_KEY) {
      // Return regular recommendations if no AI
      const recommendations = await getRuleBasedRecommendations(behaviorData, userProfile);
      return res.json(recommendations);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const likedIngredients = (behaviorData.ingredientPrefs || [])
      .filter(p => p.preference_score > 0)
      .slice(0, 10)
      .map(p => p.ingredient_name);

    const prompt = `
      Suggest 3 Thai menu items suitable for ${meal_type} on ${day_of_week}.
      
      User preferences:
      - Likes: ${likedIngredients.join(', ') || 'No specific preferences'}
      - Allergies: ${userProfile?.allergies || 'None'}
      - Calorie limit: ${userProfile?.calorie_limit || 'None'}
      
      Consider:
      - Breakfast should be light and energizing
      - Lunch should be filling but not too heavy
      - Dinner can be more substantial
      - Snacks should be light and healthy
      
      Format response as JSON:
      [
        {
          "menu_name": "Thai name",
          "reason": "Why it's good for this meal",
          "estimated_calories": number
        }
      ]
      
      Return ONLY JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        
        // Find matching menus
        const { data: menus } = await supabase
          .from('Menu')
          .select('menu_id, menu_name, menu_image, menu_description');

        const enrichedSuggestions = suggestions.map(sug => {
          const menu = menus?.find(m => 
            m.menu_name.toLowerCase().includes(sug.menu_name.toLowerCase()) ||
            sug.menu_name.toLowerCase().includes(m.menu_name.toLowerCase())
          );
          return {
            ...sug,
            menu_id: menu?.menu_id,
            menu_image: menu?.menu_image,
            exists_in_db: !!menu
          };
        });

        return res.json({
          suggestions: enrichedSuggestions,
          method: 'ai_meal_specific'
        });
      }
    } catch (parseError) {
      console.error('Error parsing meal suggestions:', parseError);
    }

    // Fallback
    const fallback = await getRuleBasedRecommendations(behaviorData, userProfile);
    res.json({
      suggestions: fallback.recommendations.slice(0, 3),
      method: 'fallback'
    });
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    res.status(500).json({ message: 'Failed to generate meal suggestions' });
  }
});

module.exports = router;
