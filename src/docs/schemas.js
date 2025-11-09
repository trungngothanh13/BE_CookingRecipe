/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username (unique)
 *         profilePicture:
 *           type: string
 *           description: URL to profile picture
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UserRegistration:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Unique username
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Password (will be hashed)
 *         profilePicture:
 *           type: string
 *           description: Optional profile picture URL
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
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
 *           items:
 *             type: object
 *             required:
 *               - label
 *             properties:
 *               label:
 *                 type: string
 *                 description: Ingredient name
 *               quantity:
 *                 type: number
 *                 description: Quantity (optional)
 *               measurement:
 *                 type: string
 *                 description: Measurement unit (optional)
 *         instructions:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - step
 *               - content
 *             properties:
 *               step:
 *                 type: integer
 *                 description: Step number
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 description: Instruction content
 *         nutrition:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 description: Nutrition type (e.g., calories, protein)
 *               quantity:
 *                 type: number
 *                 description: Quantity (optional)
 *               measurement:
 *                 type: string
 *                 description: Measurement unit (e.g., kcal, g, mg)
 *     Rating:
 *       type: object
 *       required:
 *         - ratingScore
 *       properties:
 *         ratingScore:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating score from 1 to 5
 *         comment:
 *           type: string
 *           description: Optional comment/review
 */

