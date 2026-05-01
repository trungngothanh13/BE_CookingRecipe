/**
 * @swagger
 * /api/images/profile:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload user profile image
 *     description: Upload profile picture for the authenticated user.
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
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: Missing image
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/images/course-thumbnail:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload course thumbnail (admin)
 *     description: Uploads thumbnail for a specific course.
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
 *               courseId:
 *                 type: integer
 *             required:
 *               - image
 *               - courseId
 *     responses:
 *       200:
 *         description: Course thumbnail uploaded successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
