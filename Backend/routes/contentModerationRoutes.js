const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Thai profanity word list (basic example - should be expanded)
const PROFANITY_WORDS = [
  // Common Thai profanity
  'สัตว์', 'สัตว', 'ไอ้', 'อี', 'ควาย', 'หมา', 'เหี้ย', 'แม่ง', 'สาส', 'สัส', 'ควย',
  'ชาติชั่ว', 'ระยำ', 'มึง', 'กู', 'ห่า', 'เชี่ย', 'พ่อง',
  // English profanity
  'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'bastard', 'dick',
  // Add more as needed
];

// Check content for profanity
async function checkProfanity(text) {
  const lowerText = text.toLowerCase();
  const detectedWords = [];
  
  for (const word of PROFANITY_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      detectedWords.push(word);
    }
  }

  // Determine severity (block all detected profanity)
  const severity = detectedWords.length > 0
    ? (detectedWords.length >= 3 ? 'critical' : 'high')
    : 'none';

  return {
    hasProfanity: detectedWords.length > 0,
    detectedWords,
    severity
  };
}

// AI-powered content moderation
async function checkContentWithAI(content, contentType) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Fallback to basic profanity check
      return checkProfanity(content);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Analyze the following ${contentType} content for:
      1. Profanity or inappropriate language (Thai and English)
      2. Hate speech or discrimination
      3. Spam or promotional content
      4. Threats or harmful content
      
      Content: "${content}"
      
      Respond in JSON format:
      {
        "hasProfanity": boolean,
        "hasHateSpeech": boolean,
        "isSpam": boolean,
        "hasThreat": boolean,
        "detectedIssues": ["list of specific issues found"],
        "severity": "none|low|medium|high|critical",
        "reason": "Brief explanation"
      }
      
      Be strict but fair. Consider cultural context for Thai content.
      Return ONLY JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          hasProfanity: analysis.hasProfanity || false,
          detectedWords: analysis.detectedIssues || [],
          severity: analysis.severity || 'none',
          aiAnalysis: analysis
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI moderation response:', parseError);
    }
  } catch (error) {
    console.error('Error with AI moderation:', error);
  }

  // Fallback to basic check
  return checkProfanity(content);
}

// Check recipe for plagiarism
async function checkRecipePlagiarism(recipeData) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Simple similarity check without AI
      return await simpleRecipeSimilarityCheck(recipeData);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Get existing recipes for comparison (จาก UserRecipe)
    const { data: existingRecipes } = await supabase
      .from('UserRecipe')
      .select(`
        recipe_id,
        recipe_title,
        recipe_summary,
        ingredients,
        steps
      `)
      .limit(50); // Compare with recent recipes

    // Parse recipe data
    const parsedRecipes = (existingRecipes || []).map(r => {
      return {
        recipe_id: r.recipe_id,
        recipe_title: r.recipe_title,
        recipe_summary: r.recipe_summary || null,
        ingredients: r.ingredients || [],
        steps: r.steps || []
      };
    });

    const prompt = `
      Check if the new recipe is plagiarized from existing recipes.
      
      New Recipe:
      Title: ${recipeData.title}
      Summary: ${recipeData.summary || 'None'}
      Ingredients: ${JSON.stringify(recipeData.ingredients)}
      Steps: ${JSON.stringify(recipeData.steps)}
      
      Existing Recipes to compare:
      ${parsedRecipes.map(r => `
        Title: ${r.recipe_title}
        Summary: ${r.recipe_summary || 'None'}
        Ingredients: ${JSON.stringify(r.ingredients)}
        Steps: ${JSON.stringify(r.steps)}
      `).join('\n---\n')}
      
      Analyze for:
      1. Exact or near-exact copying of recipe steps
      2. Same ingredients in same proportions
      3. Paraphrased but essentially identical instructions
      4. Consider that similar traditional recipes may have legitimate similarities
      
      Respond in JSON:
      {
        "isPlagiarized": boolean,
        "similarityScore": 0.0-1.0,
        "mostSimilarRecipeId": "recipe_id or null",
        "similarities": ["list of specific similarities found"],
        "reason": "Explanation of findings"
      }
      
      Be fair - traditional recipes often share similarities.
      Return ONLY JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing plagiarism check:', parseError);
    }
  } catch (error) {
    console.error('Error checking plagiarism:', error);
  }

  // Fallback
  return await simpleRecipeSimilarityCheck(recipeData);
}

// Simple recipe similarity check (fallback)
async function simpleRecipeSimilarityCheck(recipeData) {
  try {
    // ดึงข้อมูลจาก UserRecipe
    const { data: existingRecipes } = await supabase
      .from('UserRecipe')
      .select(`
        recipe_id,
        ingredients,
        steps
      `)
      .limit(100);

    // Parse recipe data
    const parsedRecipes = (existingRecipes || []).map(r => {
      return {
        recipe_id: r.recipe_id,
        ingredients: r.ingredients || [],
        steps: r.steps || []
      };
    });

    let highestSimilarity = 0;
    let mostSimilarId = null;

    for (const existing of parsedRecipes) {
      // Compare ingredients
      const newIngredients = JSON.stringify(recipeData.ingredients || []).toLowerCase();
      const existingIngredients = JSON.stringify(existing.ingredients || []).toLowerCase();
      
      // Simple similarity: check overlap
      const ingredientSimilarity = calculateStringSimilarity(newIngredients, existingIngredients);
      
      // Compare steps
      const newSteps = JSON.stringify(recipeData.steps || []).toLowerCase();
      const existingSteps = JSON.stringify(existing.steps || []).toLowerCase();
      const stepsSimilarity = calculateStringSimilarity(newSteps, existingSteps);
      
      const overallSimilarity = (ingredientSimilarity + stepsSimilarity) / 2;
      
      if (overallSimilarity > highestSimilarity) {
        highestSimilarity = overallSimilarity;
        mostSimilarId = existing.recipe_id;
      }
    }

    return {
      isPlagiarized: highestSimilarity > 0.8, // 80% similarity threshold
      similarityScore: highestSimilarity,
      mostSimilarRecipeId: highestSimilarity > 0.5 ? mostSimilarId : null,
      similarities: highestSimilarity > 0.5 ? ['High content similarity detected'] : [],
      reason: highestSimilarity > 0.8 ? 'Recipe appears to be very similar to existing content' : 'Recipe appears original'
    };
  } catch (error) {
    console.error('Error in similarity check:', error);
    return {
      isPlagiarized: false,
      similarityScore: 0,
      error: true
    };
  }
}

// Basic string similarity calculation
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance
function getEditDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Middleware to check content before saving
async function moderateContent(req, res, next) {
  try {
    let contentToCheck = '';
    let contentType = 'post';

    // Determine what content to check based on the route
    if (req.body.cpost_title || req.body.cpost_content) {
      contentToCheck = `${req.body.cpost_title || ''} ${req.body.cpost_content || ''}`;
      contentType = 'post';
    } else if (req.body.comment_content) {
      contentToCheck = req.body.comment_content;
      contentType = 'comment';
    } else if (req.body.recipe_title || req.body.recipe_summary) {
      contentToCheck = `${req.body.recipe_title || ''} ${req.body.recipe_summary || ''}`;
      contentType = 'recipe';
    }

    if (contentToCheck) {
      const moderation = await checkContentWithAI(contentToCheck, contentType);
      
      if (moderation.hasProfanity || moderation.severity === 'high' || moderation.severity === 'critical') {
        // Block the content
        return res.status(400).json({
          message: 'ข้อความของคุณมีเนื้อหาที่ไม่เหมาะสม กรุณาแก้ไขก่อนโพสต์',
          moderation: {
            reason: moderation.aiAnalysis?.reason || 'Inappropriate content detected',
            severity: moderation.severity
          }
        });
      } else if (moderation.hasProfanity) {
        // Add warning to response but allow posting
        req.moderationWarning = {
          message: 'พบคำที่อาจไม่เหมาะสมในข้อความของคุณ',
          severity: moderation.severity
        };
      }

      // Store moderation result for logging
      req.moderation = moderation;
    }

    next();
  } catch (error) {
    console.error('Error in content moderation middleware:', error);
    // Don't block on error, just continue
    next();
  }
}

// Routes

// Check content for moderation issues
router.post('/moderation/check', authMiddleware, async (req, res) => {
  const { content, contentType = 'post' } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const moderation = await checkContentWithAI(content, contentType);
    res.json({
      isAppropriate: moderation.severity === 'none' || moderation.severity === 'low',
      moderation
    });
  } catch (error) {
    console.error('Error checking content:', error);
    res.status(500).json({ message: 'Failed to check content' });
  }
});

// Check recipe for plagiarism
router.post('/plagiarism/check-recipe', authMiddleware, async (req, res) => {
  const { title, summary, ingredients, steps } = req.body;

  if (!title || !ingredients || !steps) {
    return res.status(400).json({ message: 'Title, ingredients, and steps are required' });
  }

  try {
    const plagiarismCheck = await checkRecipePlagiarism({
      title,
      summary,
      ingredients,
      steps
    });

    // If plagiarism detected, save to database
    if (plagiarismCheck.isPlagiarized && plagiarismCheck.mostSimilarRecipeId) {
      await supabase
        .from('ContentDuplicateDetection')
        .insert([{
          source_type: 'recipe',
          source_id: 'pending_' + Date.now(), // Temporary ID for new recipe
          duplicate_id: plagiarismCheck.mostSimilarRecipeId,
          similarity_score: plagiarismCheck.similarityScore
        }]);
    }

    res.json({
      isOriginal: !plagiarismCheck.isPlagiarized,
      plagiarismCheck
    });
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    res.status(500).json({ message: 'Failed to check plagiarism' });
  }
});

// Report content manually
router.post('/report/content', authMiddleware, async (req, res) => {
  const { contentType, contentId, reason, details } = req.body;
  const user_id = req.user.id;

  if (!contentType || !contentId || !reason) {
    return res.status(400).json({ message: 'contentType, contentId, and reason are required' });
  }

  try {
    // Check content with AI for additional context
    let contentText = '';
    if (contentType === 'post') {
      const { data: post } = await supabase
        .from('CommunityPost')
        .select('cpost_title, cpost_content')
        .eq('cpost_id', contentId)
        .single();
      contentText = `${post?.cpost_title || ''} ${post?.cpost_content || ''}`;
    } else if (contentType === 'comment') {
      const { data: comment } = await supabase
        .from('CommunityComment')
        .select('comment_text')
        .eq('comment_id', contentId)
        .single();
      contentText = comment?.comment_text || '';
    }

    const moderation = await checkContentWithAI(contentText, contentType);

    // Save to content moderation table
    await supabase
      .from('ContentModeration')
      .insert([{
        content_type: contentType,
        content_id: contentId,
        moderation_reason: reason,
        detected_words: moderation.detectedWords || [],
        severity: moderation.severity || 'medium',
        is_auto_hidden: moderation.severity === 'critical'
      }]);

    // Also create a report
    const reportId = 'REP' + Date.now();
    await supabase
      .from('CommunityReport')
      .insert([{
        creport_id: reportId,
        creport_type: reason,
        creport_reason: reason,
        creport_details: details,
        cpost_id: contentType === 'post' ? contentId : null,
        comment_id: contentType === 'comment' ? contentId : null,
        user_id
      }]);

    res.json({ 
      message: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว',
      reportId,
      aiAssessment: moderation
    });
  } catch (error) {
    console.error('Error reporting content:', error);
    res.status(500).json({ message: 'Failed to report content' });
  }
});

// Get moderation reports (admin only)
router.get('/moderation/reports', authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  try {
    // Check if user is admin
    const { data: admin } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', user_id)
      .single();

    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get pending moderation reports
    const { data: reports } = await supabase
      .from('ContentModeration')
      .select(`
        *,
        CommunityPost (cpost_title, user_id),
        CommunityComment (comment_text, user_id)
      `)
      .eq('reviewed', false)
      .order('detection_date', { ascending: false });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching moderation reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Review moderation report (admin only)
router.post('/moderation/review', authMiddleware, async (req, res) => {
  const { moderationId, action } = req.body;
  const user_id = req.user.id;

  try {
    // Check if user is admin
    const { data: admin } = await supabase
      .from('Admin')
      .select('admin_id')
      .eq('admin_id', user_id)
      .single();

    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Update moderation record
    const { error } = await supabase
      .from('ContentModeration')
      .update({
        reviewed: true,
        reviewed_by: user_id,
        review_date: new Date().toISOString(),
        review_action: action
      })
      .eq('id', moderationId);

    if (error) throw error;

    // If rejected, hide the content
    if (action === 'rejected') {
      const { data: moderation } = await supabase
        .from('ContentModeration')
        .select('content_type, content_id')
        .eq('id', moderationId)
        .single();

      if (moderation?.content_type === 'post') {
        await supabase
          .from('CommunityPost')
          .delete()
          .eq('cpost_id', moderation.content_id);
      } else if (moderation?.content_type === 'comment') {
        await supabase
          .from('CommunityComment')
          .delete()
          .eq('comment_id', moderation.content_id);
      }
    }

    res.json({ message: 'Review completed successfully' });
  } catch (error) {
    console.error('Error reviewing moderation:', error);
    res.status(500).json({ message: 'Failed to review moderation' });
  }
});

module.exports = router;
module.exports.moderateContent = moderateContent;
