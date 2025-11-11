# BE_CookingRecipe
Server side of Cooking Recipe website

## Paste this to package.json
```bash
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cloudinary": "^1.41.3",
    "cors": "^2.8.5",
    "dotenv": "^17.2.2",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.16.3",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

## Install dependencies
```bash
npm install
```
This will install all the dependencies listed in your `package.json` file.


## Testing the server
`npm run dev`

## To access protected endpoints (such as viewing user profile):
**Get a Token**: Login or register first - this generates a JWT token valid for 24 hours
**Use the Token**:
- **API Documentation**: Press the "Authorize" button and paste the token
- **Frontend**: Include token in Authorization header: `Authorization: Bearer <token>`

## Deploy API to Render
Ensure these are set in "Environment" tab:
```bash
NODE_ENV = production
DATABASE_URL = (automatically set by Render - don't add manually)
JWT_SECRET = your_secret_key_here
CLOUDINARY_CLOUD_NAME = your_cloudinary_name
CLOUDINARY_API_KEY = your_cloudinary_key
CLOUDINARY_API_SECRET = your_cloudinary_secret
```

## Connect to Postgres on Render
Example: External Database URL `postgresql://recipeuser:cwWONKbXk559qjKJmvy3axfBvqtcajC3@dpg-d3df1ur7mgec73cqk8d0-a.oregon-postgres.render.com/recipedb_s07c`
+ `dpg-d3df1ur7mgec73cqk8d0-a.oregon-postgres.render.com` is hostname
+ `cwWONKbXk559qjKJmvy3axfBvqtcajC3` is the password
+ The rest is on the info tab