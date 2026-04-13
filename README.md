# Cooking Recipe API

Backend API for the Cooking Recipe app, built with Node.js, Express, and PostgreSQL.

## What it does

- User auth and profile management
- Recipe CRUD and detail access control
- Cart and transaction flow
- Ratings and comments
- Image upload with Cloudinary
- Admin-only management endpoints

## Stack

- Node.js
- Express
- PostgreSQL
- JWT
- bcrypt
- Cloudinary
- Multer
- Swagger

## Requirements

- Node.js 16+
- PostgreSQL 12+
- npm
- Cloudinary account

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_super_secret_jwt_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PORT=5000
NODE_ENV=development
```

3. Create the database schema:
```bash
psql -U your_database_user -d your_database_name
\i src/config/databaseQueries/insert.pgsql
```

## Run locally

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

Useful URLs:
- Health check: `http://localhost:5000/api/health`
- Swagger docs: `http://localhost:5000/api-docs`

## Main API groups

- `/api/auth`
- `/api/recipes`
- `/api/cart`
- `/api/transactions`
- `/api/ratings`
- `/api/images`

## Deployment

This backend is prepared for Render.

1. Push the repo to GitHub.
2. Deploy with `render.yaml`.
3. Set production environment variables in Render:
   - `NODE_ENV=production`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Render provides `DATABASE_URL` automatically.
5. Run `src/config/databaseQueries/insert.pgsql` on the production database.

## Notes

- Backend source is in `src/`.
- Route entry point is `src/route.js`.
- Server entry point is `server.js`.
