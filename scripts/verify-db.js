const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function verifyDatabase() {
  console.log('🔍 Checking database setup...');
  console.log(`Connecting to: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('📋 Tables found:', tablesResult.rows.map(row => row.table_name));
    
    // Check if we have sample data
    const recipesQuery = 'SELECT COUNT(*) as count FROM Recipe';
    const recipesResult = await client.query(recipesQuery);
    console.log(`📊 Recipes in database: ${recipesResult.rows[0].count}`);
    
    if (parseInt(recipesResult.rows[0].count) > 0) {
      const sampleQuery = 'SELECT recipetitle, origin FROM Recipe LIMIT 3';
      const sampleResult = await client.query(sampleQuery);
      console.log('🍽️  Sample recipes:', sampleResult.rows);
    }
    
    client.release();
    console.log('✅ Database verification complete');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('Details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    await pool.end();
  }
}

verifyDatabase();