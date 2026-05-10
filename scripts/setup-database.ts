/**
 * Database Setup Script
 * Run this script to initialize your NeonDB database
 * 
 * Usage: npx tsx scripts/setup-database.ts
 */

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');

    // Step 1: Initialize database tables
    console.log('📋 Step 1: Creating database tables...');
    const initResponse = await fetch('http://localhost:3000/api/init-db', {
      method: 'POST',
    });
    const initResult = await initResponse.json();
    
    if (initResult.success) {
      console.log('✅ Database tables created successfully\n');
    } else {
      console.error('❌ Failed to create tables:', initResult.error);
      return;
    }

    // Step 2: Migrate initial products
    console.log('📦 Step 2: Migrating initial products...');
    const migrateResponse = await fetch('http://localhost:3000/api/migrate', {
      method: 'POST',
    });
    const migrateResult = await migrateResponse.json();
    
    if (migrateResult.success) {
      console.log(`✅ Migrated ${migrateResult.migratedCount} products successfully\n`);
    } else {
      console.log(`⚠️  ${migrateResult.message}\n`);
    }

    console.log('🎉 Database setup completed!');
    console.log('\nYour NeonDB is now ready to use.');
    console.log('You can now use your application with database storage.\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\nMake sure your Next.js development server is running:');
    console.log('  npm run dev\n');
  }
}

setupDatabase();

