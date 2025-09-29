const { Pool } = require('pg');
require('dotenv').config();

// Check if running in production (Render)
const isProduction = process.env.NODE_ENV === 'production';

// Configure connection based on environment
const pool = new Pool(
  isProduction
    ? {
        // Production: Use DATABASE_URL provided by Render
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Render PostgreSQL
        },
      }
    : {
        // Development: Use individual environment variables
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;