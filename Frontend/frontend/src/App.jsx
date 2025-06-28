import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CommunityPage from './pages/CommunityPage';
import SearchPage from './pages/SearchPage'; // <-- แก้ไขที่บรรทัดนี้แล้ว
import ChatbotPage from './pages/ChatbotPage';

// Import Protected Routes and their pages
import ProtectedRoute from './ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import AboutPage from './pages/AboutPage';
import MenuPage from './pages/MenuPage';

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
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* --- Protected Routes (ต้อง Login ก่อนถึงจะเข้าได้) --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
        </Route>
        
      </Routes>
    </Router>
  );
}

export default App;