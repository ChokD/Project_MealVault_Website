# AI Features Documentation

## Overview
MealVault now includes three major AI-powered features to enhance user experience and content quality:

1. **AI Food Recommendations based on User Behavior**
2. **Recipe Plagiarism Detection**
3. **Profanity/Inappropriate Content Detection**

## 1. AI Food Recommendations

### Features
- Tracks user behavior: menu views, likes, searches, meal plans
- Generates personalized recommendations using Google Gemini AI
- Falls back to rule-based recommendations when AI is unavailable
- Updates preferences in real-time based on user interactions

### How it Works
1. **Behavior Tracking**:
   - Menu views: `POST /api/behavior/menu/view`
   - Post views: `POST /api/behavior/post/view`
   - Search history: `POST /api/behavior/search`
   - Menu likes: `POST /api/behavior/menu/like`
   - Meal planning: `POST /api/behavior/menu/meal-plan`

2. **Preference Learning**:
   - Tracks ingredient preferences (positive/negative scores)
   - Tracks category preferences
   - Considers allergies and favorite foods from user profile

3. **Recommendation Generation**:
   - Get recommendations: `GET /api/ai/recommendations`
   - Meal-specific suggestions: `POST /api/ai/meal-suggestions`
   - Uses AI to analyze patterns and suggest relevant menus

### Frontend Integration
- **AIRecommendations Component**: Shows personalized recommendations on homepage
- **Menu tracking**: Automatically tracks views when users click menu details
- **Search tracking**: Records search queries and result counts

## 2. Recipe Plagiarism Detection

### Features
- Checks new recipes against existing recipes in the database
- Uses AI to detect paraphrased or slightly modified content
- Calculates similarity scores
- Warns users before posting potentially duplicate content

### How it Works
1. **Plagiarism Check API**: `POST /api/plagiarism/check-recipe`
   ```json
   {
     "title": "Recipe title",
     "summary": "Recipe summary",
     "ingredients": [{ "name": "ingredient", "amount": "1 cup" }],
     "steps": [{ "order": 1, "detail": "Step description" }]
   }
   ```

2. **AI Analysis**:
   - Compares ingredients and proportions
   - Analyzes step-by-step instructions
   - Considers legitimate similarities in traditional recipes
   - Returns similarity score (0.0 - 1.0)

3. **Frontend Integration**:
   - CreateRecipePage shows warnings for high similarity
   - Users can still post but are encouraged to add unique elements

## 3. Content Moderation

### Features
- Real-time profanity detection (Thai and English)
- Hate speech detection
- Spam detection
- Threat detection
- Severity levels: none, low, medium, high, critical

### How it Works
1. **Moderation Middleware**: Applied to post/comment/recipe creation
   - Blocks content with high/critical severity
   - Shows warnings for low/medium severity
   - Logs all detections for admin review

2. **Manual Reporting**: `POST /api/report/content`
   ```json
   {
     "contentType": "post|comment|recipe",
     "contentId": "content_id",
     "reason": "reason_for_report",
     "details": "additional details"
   }
   ```

3. **Admin Review**:
   - View reports: `GET /api/moderation/reports` (admin only)
   - Review content: `POST /api/moderation/review` (admin only)

### Frontend Integration
- CreatePostPage shows moderation warnings
- Content blocked for severe violations
- Warning messages for borderline content

## Database Schema

### New Tables Added
1. **UserMenuView** - Tracks menu view history
2. **UserPostView** - Tracks post view history
3. **UserSearchHistory** - Stores search queries
4. **UserIngredientPreference** - Learned ingredient preferences
5. **UserCategoryPreference** - Learned category preferences
6. **ContentDuplicateDetection** - Plagiarism detection results
7. **ContentModeration** - Content moderation logs

## Setup Instructions

1. **Run Database Migration**:
   ```sql
   -- In Supabase SQL editor
   -- Run the contents of: Backend/migration_add_user_behavior_tracking.sql
   ```

2. **Configure Gemini AI** (for enhanced features):
   - Add to `.env`: `GEMINI_API_KEY=your_api_key_here`
   - Get API key from: https://makersuite.google.com/app/apikey

3. **Test Features**:
   - Login as a user and browse menus to generate behavior data
   - Check homepage for AI recommendations
   - Try creating posts with profanity to test moderation
   - Create similar recipes to test plagiarism detection

## API Endpoints Summary

### Behavior Tracking
- `POST /api/behavior/menu/view` - Track menu view
- `POST /api/behavior/post/view` - Track post view
- `POST /api/behavior/search` - Track search query
- `POST /api/behavior/menu/like` - Track menu preference
- `POST /api/behavior/menu/meal-plan` - Track meal planning

### AI Recommendations
- `GET /api/ai/recommendations` - Get personalized recommendations
- `POST /api/ai/meal-suggestions` - Get meal-specific suggestions

### Content Moderation
- `POST /api/moderation/check` - Check content for issues
- `POST /api/plagiarism/check-recipe` - Check recipe originality
- `POST /api/report/content` - Report inappropriate content
- `GET /api/moderation/reports` - View moderation reports (admin)
- `POST /api/moderation/review` - Review reported content (admin)

## Notes
- All AI features work without Gemini API key (fallback to basic algorithms)
- Behavior tracking respects user privacy (only tracks logged-in users)
- Moderation is balanced to avoid over-censoring
- Traditional recipes may show similarity but are allowed
