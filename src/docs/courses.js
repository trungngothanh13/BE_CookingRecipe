/**
 * @swagger
 * /api/courses:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get public course overview list
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, newest, rating, popular]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *
 *   post:
 *     tags:
 *       - Courses
 *     summary: Create course (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *
 * /api/courses/purchased:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get purchased course IDs for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchased course IDs retrieved
 *       401:
 *         description: Authentication required
 *
 * /api/courses/{id}:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get public course detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course detail retrieved successfully
 *       404:
 *         description: Course not found
 *
 *   put:
 *     tags:
 *       - Courses
 *     summary: Replace/update course (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Course not found
 *
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Delete course (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Course not found
 *
 * /api/courses/{id}/admin:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get full course detail for admin editor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin course detail retrieved
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Course not found
 *
 * /api/courses/{id}/learn:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get purchased learning detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Learning detail retrieved
 *       403:
 *         description: Course not purchased
 *       404:
 *         description: Course not found
 *
 * /api/courses/{courseId}/lessons/{lessonId}/progress:
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update lesson progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCompleted:
 *                 type: boolean
 *             required:
 *               - isCompleted
 *     responses:
 *       200:
 *         description: Progress updated
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Course not purchased
 *       404:
 *         description: Lesson not found
 *
 * /api/courses/{courseId}/lessons/{lessonId}/assignment/submit:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Submit assignment answers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Assignment submitted
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Course not purchased
 *       404:
 *         description: Lesson not found
 *
 * /api/courses/{id}/reviews:
 *   get:
 *     tags:
 *       - Courses
 *     summary: Get course reviews and summary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Course not found
 *
 *   post:
 *     tags:
 *       - Courses
 *     summary: Create or update current user's review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *             required:
 *               - rating
 *     responses:
 *       200:
 *         description: Review saved successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Course not purchased
 *       404:
 *         description: Course not found
 *
 *   put:
 *     tags:
 *       - Courses
 *     summary: Update current user's review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               comment:
 *                 type: string
 *             required:
 *               - rating
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Course not purchased
 *       404:
 *         description: Course not found
 *
 *   delete:
 *     tags:
 *       - Courses
 *     summary: Delete current user's review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Course not purchased
 *       404:
 *         description: Course not found
 */
