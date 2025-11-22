import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CommunityPage from './pages/CommunityPage';

import AboutPage from './pages/AboutPage'; 
// import PostDetailPage from './pages/PostDetailPage'; // ลบออกเพราะไม่ได้ใช้แล้ว
import MenuPage from './pages/MenuPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import SearchPage from './pages/SearchPage';
import WeeklyMealPlanPage from './pages/WeeklyMealPlanPage';
import ChatbotPage from './pages/ChatbotPage';

// Import Protected Routes and their pages
import ProtectedRoute from './ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import MealCalendarPage from './pages/MealCalendarPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public Routes (ทุกคนเข้าได้) --- */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/community" element={<CommunityPage />} />
        {/* <Route path="/posts/:postId" element={<PostDetailPage />} /> // ลบออกเพราะไม่ได้ใช้แล้ว */}
        
        <Route path="/menus" element={<MenuPage />} />
        <Route path="/menus/:recipeId" element={<RecipeDetailPage />} />
        
        {/* ใช้ Route สำหรับ SearchPage ที่เราสร้างไว้สำหรับค้นหาภายใน */}
        <Route path="/search" element={<SearchPage />} /> 
        <Route path="/chatbot" element={<ChatbotPage />} />
        {/* --- Protected Routes (ต้อง Login ก่อนถึงจะเข้าได้) --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/weekly-plan" element={<WeeklyMealPlanPage />} />
          <Route path="/meal-calendar" element={<MealCalendarPage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/edit-post/:id" element={<EditPostPage />} />
          {/* สามารถเพิ่ม Route ที่ต้องการป้องกันอื่นๆ ได้ที่นี่ในอนาคต */}
        </Route>
        
      </Routes>
    </Router>
  );
}

export default App;