const { neon } = require('@neondatabase/serverless');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not found in environment');
      process.exit(1);
    }

    console.log('🔍 Testing database connection...');
    console.log('📡 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    const sql = neon(databaseUrl, {
      fetchOptions: {
        cache: 'no-store',
      },
    });

    // Test query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    console.log('✅ Connection successful!');
    console.log('🕐 Current time:', result[0].current_time);
    console.log('📊 PostgreSQL version:', result[0].pg_version.split(' ')[0] + ' ' + result[0].pg_version.split(' ')[1]);
    
    // Test table access
    try {
      const products = await sql`SELECT COUNT(*) as count FROM products`;
      console.log('📦 Products table accessible:', products[0].count, 'products found');
    } catch (error) {
      console.log('⚠️  Products table error:', error.message);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause.message || error.cause);
    }
    process.exit(1);
  }
}

testConnection();
