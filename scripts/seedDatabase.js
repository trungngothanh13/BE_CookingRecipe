/**
 * Database Seeding Script for Render PostgreSQL
 * 
 * This script will:
 * 1. Create all tables (from insert.pgsql)
 * 2. Insert mock data (from mockdata.pgsql)
 * 
 * Usage:
 *   node scripts/seedDatabase.js
 * 
 * Make sure DATABASE_URL is set in your environment variables
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Check if running in production (Render)
const isProduction = process.env.NODE_ENV === 'production';

// Configure connection
const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Render PostgreSQL
        },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Read SQL files
    const insertSQLPath = path.join(__dirname, '../src/config/databaseQueries/insert.pgsql');
    const mockdataSQLPath = path.join(__dirname, '../src/config/databaseQueries/mockdata.pgsql');
    
    if (!fs.existsSync(insertSQLPath)) {
      throw new Error(`Schema file not found: ${insertSQLPath}`);
    }
    
    if (!fs.existsSync(mockdataSQLPath)) {
      throw new Error(`Mock data file not found: ${mockdataSQLPath}`);
    }
    
    const insertSQL = fs.readFileSync(insertSQLPath, 'utf8');
    const mockdataSQL = fs.readFileSync(mockdataSQLPath, 'utf8');
    
    // Execute schema creation
    console.log('📋 Creating database schema...');
    await client.query(insertSQL);
    console.log('✅ Schema created successfully');
    
    // Execute mock data insertion
    console.log('📦 Inserting mock data...');
    await client.query(mockdataSQL);
    console.log('✅ Mock data inserted successfully');
    
    // Verify data
    console.log('🔍 Verifying data...');
    const userCount = await client.query('SELECT COUNT(*) FROM "User"');
    const recipeCount = await client.query('SELECT COUNT(*) FROM Recipe');
    
    console.log(`✅ Verification complete:`);
    console.log(`   - Users: ${userCount.rows[0].count}`);
    console.log(`   - Recipes: ${recipeCount.rows[0].count}`);
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

