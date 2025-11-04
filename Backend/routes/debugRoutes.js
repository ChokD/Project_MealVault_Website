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

module.exports = router;

