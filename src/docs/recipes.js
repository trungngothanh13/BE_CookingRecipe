/**
 * @swagger
 * /api/recipes:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get recipes overview (Public)
 *     description: Get a list of recipes with search, filter, and sort options. Public access - no authentication required.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by recipe title or category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: cookingTime
 *         schema:
 *           type: string
 *           enum: ['<30', '30-60', '60-120', '>120']
 *         description: Filter by cooking time range (in minutes)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, newest, rating, popular]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Recipes overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recipes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           videoUrl:
 *                             type: string
 *                             description: YouTube video URL (publicly accessible)
 *                           videoThumbnail:
 *                             type: string
 *                           price:
 *                             type: number
 *                           difficulty:
 *                             type: string
 *                           cookingTime:
 *                             type: integer
 *                           servings:
 *                             type: integer
 *                           category:
 *                             type: string
 *                           viewCount:
 *                             type: integer
 *                           purchaseCount:
 *                             type: integer
 *                           rating:
 *                             type: number
 *                           totalRatings:
 *                             type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */

/**
 * @swagger
 * /api/recipes/my-recipes:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get user's purchased recipes (Authenticated)
 *     description: Get a list of recipes that the authenticated user has purchased. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by recipe title or category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: cookingTime
 *         schema:
 *           type: string
 *           enum: ['<30', '30-60', '60-120', '>120']
 *         description: Filter by cooking time range (in minutes)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, newest, rating, popular]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Purchased recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     recipes:
 *                       type: array
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NewRecipe:
 *       type: object
 *       required:
 *         - title
 *         - price
 *         - difficulty
 *         - cookingTime
 *         - servings
 *         - category
 *         - ingredients
 *         - instructions
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *           description: Recipe title
 *         description:
 *           type: string
 *           description: Recipe description
 *         videoUrl:
 *           type: string
 *           description: Video URL (optional)
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Recipe price
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Difficulty level
 *         cookingTime:
 *           type: integer
 *           minimum: 1
 *           description: Cooking time in minutes
 *         servings:
 *           type: integer
 *           minimum: 1
 *           description: Number of servings
 *         category:
 *           type: string
 *           description: Recipe category
 *         ingredients:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - label
 *             properties:
 *               label:
 *                 type: string
 *                 maxLength: 100
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               measurement:
 *                 type: string
 *                 maxLength: 20
 *         instructions:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - step
 *               - content
 *             properties:
 *               step:
 *                 type: integer
 *                 minimum: 1
 *               content:
 *                 type: string
 *                 minLength: 10
 *         nutrition:
 *           type: array
 *           description: Optional nutrition information
 *           items:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 description: Nutrition type (e.g., calories, protein, carbs, fat)
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               measurement:
 *                 type: string
 *                 description: Measurement unit (e.g., kcal, g, mg)
 */

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     tags:
 *       - Recipes
 *     summary: Get recipe detail (Admin or Purchased users only)
 *     description: |
 *       Get full recipe details including ingredients, instructions, and nutrition. 
 *       Only admins or users who have purchased the recipe can access.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                       description: YouTube video URL (always included)
 *                     videoThumbnail:
 *                       type: string
 *                     price:
 *                       type: number
 *                     difficulty:
 *                       type: string
 *                     cookingTime:
 *                       type: integer
 *                     servings:
 *                       type: integer
 *                     category:
 *                       type: string
 *                     viewCount:
 *                       type: integer
 *                     purchaseCount:
 *                       type: integer
 *                     rating:
 *                       type: number
 *                     totalRatings:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     ingredients:
 *                       type: array
 *                       description: Only included if user has purchased recipe or is admin
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           label:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           measurement:
 *                             type: string
 *                     instructions:
 *                       type: array
 *                       description: Only included if user has purchased recipe or is admin
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           step:
 *                             type: integer
 *                           content:
 *                             type: string
 *                     nutrition:
 *                       type: array
 *                       description: Only included if user has purchased recipe or is admin
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           measurement:
 *                             type: string
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied - must purchase recipe or be admin
 *       404:
 *         description: Recipe not found
 */

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     tags:
 *       - Recipes
 *     summary: Update a recipe (Admin only)
 *     description: Update an existing recipe with overview data, ingredients, instructions, and optional nutrition. Only admins can update recipes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Recipe ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewRecipe'
 *           example:
 *             title: "Updated Margherita Pizza"
 *             description: "Even better traditional Italian pizza"
 *             videoUrl: "https://www.youtube.com/watch?v=example"
 *             price: 14.99
 *             difficulty: "medium"
 *             cookingTime: 30
 *             servings: 4
 *             category: "Italian"
 *             ingredients:
 *               - label: "Pizza dough"
 *                 quantity: 1
 *                 measurement: "ball"
 *               - label: "San Marzano tomatoes"
 *                 quantity: 400
 *                 measurement: "grams"
 *             instructions:
 *               - step: 1
 *                 content: "Preheat oven to 500°F (260°C)"
 *               - step: 2
 *                 content: "Prepare the dough and let it rest for 30 minutes"
 *             nutrition:
 *               - type: "calories"
 *                 quantity: 300
 *                 measurement: "kcal"
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Recipe updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                     price:
 *                       type: number
 *                     difficulty:
 *                       type: string
 *                     cookingTime:
 *                       type: integer
 *                     servings:
 *                       type: integer
 *                     category:
 *                       type: string
 *                     ingredients:
 *                       type: array
 *                     instructions:
 *                       type: array
 *                     nutrition:
 *                       type: array
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     tags:
 *       - Recipes
 *     summary: Create a new recipe (Admin only)
 *     description: Create a new recipe with overview data, ingredients, instructions, and optional nutrition. Only admins can create recipes.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewRecipe'
 *           example:
 *             title: "Classic Margherita Pizza"
 *             description: "Traditional Italian pizza with tomato, mozzarella, and fresh basil"
 *             videoUrl: "https://www.youtube.com/watch?v=example"
 *             price: 12.99
 *             difficulty: "medium"
 *             cookingTime: 25
 *             servings: 4
 *             category: "Italian"
 *             ingredients:
 *               - label: "Pizza dough"
 *                 quantity: 1
 *                 measurement: "ball"
 *               - label: "Tomato sauce"
 *                 quantity: 0.5
 *                 measurement: "cup"
 *               - label: "Mozzarella cheese"
 *                 quantity: 200
 *                 measurement: "grams"
 *             instructions:
 *               - step: 1
 *                 content: "Preheat oven to 475°F (245°C)"
 *               - step: 2
 *                 content: "Roll out pizza dough on a floured surface"
 *               - step: 3
 *                 content: "Spread tomato sauce evenly over the dough"
 *             nutrition:
 *               - type: "calories"
 *                 quantity: 280
 *                 measurement: "kcal"
 *               - type: "protein"
 *                 quantity: 12
 *                 measurement: "g"
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Recipe created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                     price:
 *                       type: number
 *                     difficulty:
 *                       type: string
 *                     cookingTime:
 *                       type: integer
 *                     servings:
 *                       type: integer
 *                     category:
 *                       type: string
 *                     ingredients:
 *                       type: array
 *                     instructions:
 *                       type: array
 *                     nutrition:
 *                       type: array
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     tags:
 *       - Recipes
 *     summary: Delete a recipe (Admin only)
 *     description: Delete an existing recipe. Only admins can delete recipes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID to delete
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Recipe "Classic Margherita Pizza" deleted successfully'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */