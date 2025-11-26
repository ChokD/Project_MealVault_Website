// Recipe Duplicate Detection Utilities
// Provides text similarity and content comparison functions

/**
 * Calculate Levenshtein distance between two strings
 * Returns a number indicating how different the strings are (lower = more similar)
 */
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator,
      );
    }
  }
  return track[str2.length][str1.length];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  // Normalize texts
  const normalized1 = text1.toLowerCase().trim();
  const normalized2 = text2.toLowerCase().trim();
  
  if (normalized1 === normalized2) return 100;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity * 100) / 100;
}

/**
 * Calculate Jaccard similarity for arrays (ingredients, steps)
 */
function calculateJaccardSimilarity(array1, array2) {
  if (!array1 || !array2 || array1.length === 0 || array2.length === 0) return 0;
  
  // Normalize items
  const set1 = new Set(array1.map(item => 
    String(item).toLowerCase().trim()
  ));
  const set2 = new Set(array2.map(item => 
    String(item).toLowerCase().trim()
  ));
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  
  return (intersection.size / union.size) * 100;
}

/**
 * Extract keywords from text (simple word frequency)
 */
function extractKeywords(text, topN = 10) {
  if (!text) return [];
  
  // Remove common Thai/English stop words
  const stopWords = new Set([
    'และ', 'หรือ', 'ที่', 'เป็น', 'ใน', 'ของ', 'กับ', 'จาก', 'ให้', 'มี',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'
  ]);
  
  // Extract words
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

/**
 * Check if recipe is likely duplicate of another
 * Returns { isDuplicate: boolean, score: number, details: object }
 */
function checkRecipeDuplicate(newRecipe, existingRecipe) {
  const scores = {
    title: 0,
    ingredients: 0,
    steps: 0,
    overall: 0
  };
  
  // 1. Compare titles (weight: 20%)
  const newTitle = newRecipe.title || newRecipe.recipe_name || newRecipe.recipe_title || '';
  const existingTitle = existingRecipe.title || existingRecipe.recipe_name || existingRecipe.recipe_title || '';
  
  if (newTitle && existingTitle) {
    scores.title = calculateTextSimilarity(newTitle, existingTitle);
  }
  
  // 2. Compare ingredients (weight: 40%)
  const newIngredients = newRecipe.ingredients || '';
  const existingIngredients = existingRecipe.ingredients || '';
  
  if (newIngredients && existingIngredients) {
    // Handle both string and array formats
    const newIngredientsText = typeof newIngredients === 'string' 
      ? newIngredients 
      : Array.isArray(newIngredients)
      ? newIngredients.map(i => (typeof i === 'string' ? i : (i.name || ''))).join(' ')
      : '';
    
    const existingIngredientsText = typeof existingIngredients === 'string'
      ? existingIngredients
      : Array.isArray(existingIngredients)
      ? existingIngredients.map(i => (typeof i === 'string' ? i : (i.name || ''))).join(' ')
      : '';
    
    scores.ingredients = calculateTextSimilarity(newIngredientsText, existingIngredientsText);
  }
  
  // 3. Compare steps (weight: 40%)
  const newSteps = newRecipe.steps || '';
  const existingSteps = existingRecipe.steps || '';
  
  if (newSteps && existingSteps) {
    // Handle both string and array formats
    const newStepsText = typeof newSteps === 'string'
      ? newSteps
      : Array.isArray(newSteps)
      ? newSteps.map(s => (typeof s === 'string' ? s : (s.detail || ''))).join(' ')
      : '';
    
    const existingStepsText = typeof existingSteps === 'string'
      ? existingSteps
      : Array.isArray(existingSteps)
      ? existingSteps.map(s => (typeof s === 'string' ? s : (s.detail || ''))).join(' ')
      : '';
    
    scores.steps = calculateTextSimilarity(newStepsText, existingStepsText);
  }
  
  // Calculate weighted overall score
  scores.overall = Math.round(
    (scores.title * 0.2) + 
    (scores.ingredients * 0.4) + 
    (scores.steps * 0.4)
  );
  
  // Determine if duplicate based on thresholds (lowered to 40% warning)
  const isDuplicate = 
    scores.overall >= 90 ||  // Overall very similar - BLOCK
    (scores.title >= 95 && scores.ingredients >= 90) ||  // Almost identical name + ingredients - BLOCK
    (scores.ingredients >= 95 && scores.steps >= 90);  // Almost identical content - BLOCK
  
  return {
    isDuplicate,
    score: scores.overall,
    overallScore: scores.overall,
    details: scores,
    confidence: isDuplicate ? 'high' : scores.overall >= 40 ? 'medium' : 'low'  // Warning at 40%+
  };
}

/**
 * Analyze recipe content for suspicious patterns
 * Returns suspicion score (0-100) and reasons
 */
function analyzeSuspiciousPatterns(recipe) {
  let suspicionScore = 0;
  const reasons = [];
  
  // Check 1: Has external URL patterns in content
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const recipeText = `${recipe.recipe_name || ''} ${recipe.recipe_summary || ''} ${recipe.steps || ''}`;
  
  if (urlPattern.test(recipeText)) {
    suspicionScore += 20;
    reasons.push('มี URL ในเนื้อหา');
  }
  
  // Check 2: Has credit/source keywords
  const creditKeywords = ['ที่มา', 'จาก', 'credit', 'source', 'recipe from', 'adapted from'];
  const lowerText = recipeText.toLowerCase();
  
  if (creditKeywords.some(keyword => lowerText.includes(keyword))) {
    suspicionScore += 15;
    reasons.push('มีคำที่บ่งบอกถึงแหล่งที่มา');
  }
  
  // Check 3: No source_url but is_original is false
  if (recipe.is_original === false && !recipe.source_url) {
    suspicionScore += 25;
    reasons.push('ระบุว่าไม่ใช่สูตรต้นฉบับ แต่ไม่ระบุแหล่งที่มา');
  }
  
  // Check 4: Very professional/formal writing style (might be copied from website)
  const formalWords = ['ส่วนผสม:', 'วิธีทำ:', 'ขั้นตอน:', 'หมายเหตุ:', 'ingredients:', 'instructions:'];
  const formalCount = formalWords.filter(word => lowerText.includes(word)).length;
  
  if (formalCount >= 3) {
    suspicionScore += 10;
    reasons.push('รูปแบบการเขียนเป็นทางการมาก');
  }
  
  // Check 5: Has copyright symbols or reserved phrases
  if (/©|®|™|all rights reserved|สงวนลิขสิทธิ์/i.test(recipeText)) {
    suspicionScore += 30;
    reasons.push('มีสัญลักษณ์ลิขสิทธิ์');
  }
  
  return {
    suspicionScore: Math.min(suspicionScore, 100),
    reasons,
    risk: suspicionScore >= 60 ? 'high' : suspicionScore >= 30 ? 'medium' : 'low'
  };
}

module.exports = {
  calculateTextSimilarity,
  calculateJaccardSimilarity,
  extractKeywords,
  checkRecipeDuplicate,
  analyzeSuspiciousPatterns,
  levenshteinDistance
};
