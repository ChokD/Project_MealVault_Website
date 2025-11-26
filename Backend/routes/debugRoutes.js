// Debug routes สำหรับตรวจสอบปัญหา
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

// GET /api/debug/check-supabase - ตรวจสอบ Supabase connection
router.get('/check-supabase', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase client is not initialized',
        env: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasKey: !!process.env.SUPABASE_ANON_KEY,
          url: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'Missing',
        }
      });
    }

    // ทดสอบ query
    const { data, error } = await supabase
      .from('User')
      .select('user_id, user_email')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Supabase query error',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Supabase connection OK',
      userCount: data?.length || 0,
      sampleUser: data?.[0] || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking Supabase',
      error: error.message
    });
  }
});

// GET /api/debug/test-password - ทดสอบ password hashing
router.get('/test-password', async (req, res) => {
  const { password } = req.query;
  
  if (!password) {
    return res.status(400).json({
      message: 'Please provide password parameter: ?password=test1'
    });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const match = await bcrypt.compare(password, hash);

    res.json({
      inputPassword: password,
      hash: hash,
      hashLength: hash.length,
      hashStartsWith: hash.substring(0, 20),
      matchResult: match,
      message: match ? '✅ Password hash works correctly' : '❌ Password hash failed'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error testing password',
      error: error.message
    });
  }
});

// GET /api/debug/check-user/:email - ตรวจสอบ user ใน database
router.get('/check-user/:email', async (req, res) => {
  const { email } = req.params;

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase client is not initialized'
    });
  }

  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('user_id, user_email, user_fname, user_password')
      .eq('user_email', email)
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Query error',
        error: error.message
      });
    }

    if (!users || users.length === 0) {
      return res.json({
        success: false,
        message: 'User not found',
        email: email
      });
    }

    const user = users[0];
    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        user_email: user.user_email,
        user_fname: user.user_fname,
        hasPassword: !!user.user_password,
        passwordHashLength: user.user_password?.length || 0,
        passwordHashPreview: user.user_password?.substring(0, 20) + '...',
        passwordHashStartsWith: user.user_password?.substring(0, 7) || 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking user',
      error: error.message
    });
  }
});

// GET /api/debug/check-behavior-tables - ตรวจสอบ behavior tracking tables
router.get('/check-behavior-tables', async (req, res) => {
  try {
    const results = {};

    // Check UserPostView
    const { data: postViews, error: postError } = await supabase
      .from('UserPostView')
      .select('*')
      .limit(5);
    
    results.UserPostView = {
      exists: !postError,
      error: postError?.message || null,
      count: postViews?.length || 0,
      sample: postViews?.[0] || null
    };

    // Check UserMenuView
    const { data: menuViews, error: menuError } = await supabase
      .from('UserMenuView')
      .select('*')
      .limit(5);
    
    results.UserMenuView = {
      exists: !menuError,
      error: menuError?.message || null,
      count: menuViews?.length || 0,
      sample: menuViews?.[0] || null
    };

    // Check UserIngredientPreference
    const { data: ingredients, error: ingredientError } = await supabase
      .from('UserIngredientPreference')
      .select('*')
      .limit(5);
    
    results.UserIngredientPreference = {
      exists: !ingredientError,
      error: ingredientError?.message || null,
      count: ingredients?.length || 0,
      sample: ingredients?.[0] || null
    };

    // Check UserSearchHistory
    const { data: searches, error: searchError } = await supabase
      .from('UserSearchHistory')
      .select('*')
      .limit(5);
    
    results.UserSearchHistory = {
      exists: !searchError,
      error: searchError?.message || null,
      count: searches?.length || 0,
      sample: searches?.[0] || null
    };

    res.json({
      success: true,
      message: 'Behavior tracking tables check complete',
      tables: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking behavior tables',
      error: error.message
    });
  }
});

// POST /api/debug/test-post-view - ทดสอบการเพิ่ม post view
router.post('/test-post-view', async (req, res) => {
  const { user_id, cpost_id } = req.body;

  if (!user_id || !cpost_id) {
    return res.status(400).json({
      message: 'user_id and cpost_id are required',
      example: { user_id: 'U123', cpost_id: 'CP123' }
    });
  }

  try {
    // Try to insert
    const { data, error } = await supabase
      .from('UserPostView')
      .insert([{ user_id, cpost_id }])
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to insert post view',
        error: error.message,
        details: error
      });
    }

    res.json({
      success: true,
      message: 'Post view tracked successfully',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing post view',
      error: error.message
    });
  }
});

module.exports = router;

