import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage'; // 1. ตรวจสอบว่า import เข้ามาแล้ว
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage'; // <-- เพิ่ม
import CommunityPage from './pages/CommunityPage';
import CreatePostPage from './pages/CreatePostPage';
import ProtectedRoute from './ProtectedRoute';
import PostDetailPage from './pages/PostDetailPage'; // <-- เพิ่ม import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUpPage />} /> 
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} /> 
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} /> 
        </Route>
      </Routes>
    </Router>
  );
}

export default App;