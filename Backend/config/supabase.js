const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ตรวจสอบว่ามี Supabase credentials หรือไม่
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
  console.warn('⚠️  Some features may not work without Supabase configuration.');
}

// สร้าง Supabase client
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Debug: แสดงสถานะการเชื่อมต่อ
if (supabase) {
  console.log('✅ Supabase client initialized successfully');
  console.log(`   URL: ${supabaseUrl?.substring(0, 30)}...`);
} else {
  console.error('❌ Supabase client NOT initialized');
  console.error('   Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
}

module.exports = { supabase };

