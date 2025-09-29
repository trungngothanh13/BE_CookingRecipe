# Deploy Recipe API to Render - Complete Guide

## Overview
This guide will help you deploy your Node.js Recipe API to Render with PostgreSQL database.

---

## STEP 1: Prepare Your Code

### 1.1 Create `render.yaml` file
Create a new file `render.yaml` in your project root:

```yaml
services:
  # Web Service (Your Node.js API)
  - type: web
    name: recipe-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: recipe-db
          property: connectionString
      # Add these in Render dashboard manually:
      # - CLOUDINARY_CLOUD_NAME
      # - CLOUDINARY_API_KEY
      # - CLOUDINARY_API_SECRET
      # - JWT_SECRET

databases:
  # PostgreSQL Database
  - name: recipe-db
    plan: free
    databaseName: recipedb
    user: recipeuser
```

### 1.2 Update `server.js` PORT configuration
Your current code already handles this correctly:
```javascript
const PORT = process.env.PORT || 5000;
```
✅ This is good! Render will automatically set the PORT environment variable.

### 1.3 Update database configuration
Create a new file `src/config/database.js` (replace existing):

```javascript
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
```

### 1.4 Update `package.json` scripts
Verify your `package.json` has:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

---

## STEP 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Prepare for Render deployment"
```

### 2.2 Create `.gitignore` file
```
node_modules/
.env
temp/
*.log
.DS_Store
```

### 2.3 Push to GitHub
```bash
# Create a new repository on GitHub first, then:
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

---

## STEP 3: Deploy to Render

### 3.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 3.2 Create New Blueprint
1. Click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Render will detect your `render.yaml` file
4. Click **"Apply"**

### 3.3 Wait for Database Creation
- Render will create the PostgreSQL database first
- This takes about 2-3 minutes
- ✅ Database status will show "Available"

### 3.4 Set Environment Variables
1. Go to your web service (recipe-api)
2. Click **"Environment"** tab
3. Add these variables:

```
NODE_ENV = production
CLOUDINARY_CLOUD_NAME = your_cloudinary_name
CLOUDINARY_API_KEY = your_cloudinary_key
CLOUDINARY_API_SECRET = your_cloudinary_secret
JWT_SECRET = your_super_secret_jwt_key_change_this
```

**Important:** `DATABASE_URL` is automatically set by Render - don't add it manually!

---

## STEP 4: Initialize Database Schema

### 4.1 Get Database Connection String
1. Go to your **recipe-db** database in Render
2. Click **"Info"** tab
3. Copy the **"External Database URL"**

### 4.2 Connect with psql or pgAdmin
Using psql:
```bash
psql "YOUR_EXTERNAL_DATABASE_URL"
```

### 4.3 Run Schema Creation
Copy and paste your entire SQL schema from `src/config/databaseQueries/insert.pgsql`:

```sql
-- Drop existing tables if they exist
DROP TABLE IF EXISTS Recipe_Image CASCADE;
DROP TABLE IF EXISTS Image CASCADE;
-- ... (rest of your schema)
```

---

## STEP 5: Verify Deployment

### 5.1 Check Service Status
1. Your web service should show **"Live"** status
2. Click on the URL (e.g., `https://recipe-api-xxxx.onrender.com`)

### 5.2 Test API Endpoints
```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# API documentation
# Visit: https://your-app-name.onrender.com/api-docs
```

---

## STEP 6: Update CORS Settings

### 6.1 Update `server.js`
After deployment, update your CORS configuration:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', // Local frontend
    'https://your-frontend-app.onrender.com', // Production frontend
  ]
}));
```

### 6.2 Redeploy
```bash
git add .
git commit -m "Update CORS settings"
git push
```
Render will automatically redeploy.

---

## Common Issues & Solutions

### ❌ Issue: Port binding error
**Solution:** Make sure your server uses `process.env.PORT`:
```javascript
const PORT = process.env.PORT || 5000;
```

### ❌ Issue: Database connection failed
**Solution:** Check if:
1. Database is "Available" status
2. `ssl: { rejectUnauthorized: false }` is in production config
3. Don't manually set DATABASE_URL - Render does this automatically

### ❌ Issue: Build fails
**Solution:** 
1. Check build logs in Render dashboard
2. Make sure all dependencies are in `package.json`
3. Verify Node.js version compatibility

### ❌ Issue: App crashes after deployment
**Solution:**
1. Check logs in Render dashboard
2. Verify all environment variables are set
3. Test database connection

---

## Monitoring Your App

### View Logs
1. Go to your web service in Render
2. Click **"Logs"** tab
3. Monitor real-time logs

### Check Metrics
1. Click **"Metrics"** tab
2. View CPU, Memory, and Request metrics

---

## Cost Information

### Free Tier Includes:
- ✅ 750 hours/month for web services
- ✅ 1 GB RAM
- ✅ PostgreSQL database (90 days retention)
- ⚠️ Spins down after 15 minutes of inactivity (cold starts ~30-60 seconds)

### Upgrade Options:
- **Starter Plan ($7/month):** No spin down, more resources
- **Database Storage:** Extra storage if needed

---

## Next Steps

1. ✅ Test all API endpoints
2. ✅ Create a user account
3. ✅ Create and retrieve recipes
4. ✅ Upload images
5. ✅ Connect your frontend application
6. ✅ Set up custom domain (optional)

---

## Important URLs to Save

- **Your API:** https://recipe-api-xxxx.onrender.com
- **API Docs:** https://recipe-api-xxxx.onrender.com/api-docs
- **Database Dashboard:** Render Dashboard → recipe-db
- **Logs:** Render Dashboard → recipe-api → Logs

---

## Support Resources

- Render Docs: https://render.com/docs
- Community Forum: https://community.render.com
- Status Page: https://status.render.com

---