/**
 * @swagger
 * /api/images/profile:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload profile picture
 *     description: Upload a profile picture for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture image file
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
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
 *                   example: "Profile picture uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/example/image/upload/v1234567/profile/user123.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "profile/user123"
 *       400:
 *         description: No image file provided
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/images/recipe-thumbnail:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload video thumbnail for recipe (Admin only)
 *     description: Upload a video thumbnail image for a recipe. Only admins can manage recipe images.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - recipeId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Video thumbnail image file
 *               recipeId:
 *                 type: integer
 *                 description: Recipe ID to update
 *     responses:
 *       200:
 *         description: Video thumbnail uploaded successfully
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
 *                   example: "Video thumbnail uploaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/example/image/upload/v1234567/thumbnails/recipe123.jpg"
 *                     thumbnailUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/example/image/upload/w_400,h_300,c_fill/v1234567/thumbnails/recipe123.jpg"
 *                     publicId:
 *                       type: string
 *                       example: "thumbnails/recipe123"
 *       400:
 *         description: No image file provided or recipeId missing
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */