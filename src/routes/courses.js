const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const courseService = require('../services/courseService');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/courses.js

router.get('/', async (req, res) => {
  try {
    const {
      search,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const result = await courseService.getCoursesOverview({
      search,
      sortBy,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get courses overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/me/purchases', authenticateToken, async (req, res) => {
  try {
    const courseIds = await courseService.getPurchasedCourseIds(req.user.userId);
    res.json({
      success: true,
      data: { courseIds }
    });
  } catch (error) {
    console.error('Get purchased courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id/reviews', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    let currentUserId = null;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (_) {
        currentUserId = null;
      }
    }

    const result = await courseService.getCourseReviews(courseId, currentUserId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get course reviews error:', error);
    const status = error.message === 'Course not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? error.message : 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    const { rating, comment } = req.body || {};
    const review = await courseService.upsertCourseReview(req.user.userId, courseId, rating, comment);
    res.json({ success: true, data: review, message: 'Review saved' });
  } catch (error) {
    console.error('Upsert course review error:', error);
    const status =
      error.message === 'Course not found'
        ? 404
        : (error.message === 'Course access denied' ? 403 : (error.message.includes('Rating') ? 400 : 500));
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Failed to save review' : error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    const { rating, comment } = req.body || {};
    const review = await courseService.upsertCourseReview(req.user.userId, courseId, rating, comment);
    res.json({ success: true, data: review, message: 'Review updated' });
  } catch (error) {
    console.error('Update course review error:', error);
    const status =
      error.message === 'Course not found'
        ? 404
        : (error.message === 'Course access denied' ? 403 : (error.message.includes('Rating') ? 400 : 500));
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Failed to update review' : error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    await courseService.deleteCourseReview(req.user.userId, courseId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete course review error:', error);
    const status = error.message === 'Review not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? error.message : 'Failed to delete review',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await courseService.createCourse(req.body || {});
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Create course error:', error);
    const status = error.message === 'Invalid payload' || error.message.includes('required') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: status === 400 ? error.message : 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    const result = await courseService.getAdminCourseDetail(courseId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get admin course detail error:', error);
    const status = error.message === 'Course not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? error.message : 'Failed to fetch course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    const result = await courseService.updateCourse(courseId, req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update course error:', error);
    const status =
      error.message === 'Course not found'
        ? 404
        : (error.message === 'Invalid payload' || error.message.includes('required') ? 400 : 500);
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Failed to update course' : error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    const result = await courseService.deleteCourse(courseId);
    res.json({ success: true, data: result, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    const status = error.message === 'Course not found' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? error.message : 'Failed to delete course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const result = await courseService.getCourseOverviewDetail(courseId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get course overview detail error:', error);

    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id/learn', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const result = await courseService.getCourseLearningDetail(courseId, req.user.userId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get course learning detail error:', error);

    if (error.message === 'Course not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Course access denied') {
      return res.status(403).json({ success: false, message: 'You have not purchased this course' });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id/certificate', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const certificate = await courseService.generateCourseCertificate(courseId, req.user.userId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.fileName}"`);
    return res.send(Buffer.from(certificate.bytes));
  } catch (error) {
    console.error('Generate certificate error:', error);

    if (error.message === 'Course not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Course access denied') {
      return res.status(403).json({ success: false, message: 'You have not purchased this course' });
    }
    if (error.message.includes('Certificate is available')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:courseId/lessons/:lessonId/progress', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const lessonId = parseInt(req.params.lessonId, 10);
    const isCompleted = !!req.body?.isCompleted;

    if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID or lesson ID'
      });
    }

    const result = await courseService.markLessonProgress(req.user.userId, courseId, lessonId, isCompleted);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Update lesson progress error:', error);

    if (error.message === 'Course access denied') {
      return res.status(403).json({ success: false, message: 'You have not purchased this course' });
    }
    if (error.message === 'Lesson not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Assignment progress must be updated from assignment submission') {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update lesson progress',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/:courseId/lessons/:lessonId/assignment/submit', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId, 10);
    const lessonId = parseInt(req.params.lessonId, 10);
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

    if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID or lesson ID'
      });
    }

    const result = await courseService.submitAssignment(req.user.userId, courseId, lessonId, answers);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Submit assignment error:', error);

    if (error.message === 'Course access denied') {
      return res.status(403).json({ success: false, message: 'You have not purchased this course' });
    }
    if (error.message === 'Lesson not found' || error.message === 'Assignment content not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Lesson is not an assignment' || error.message === 'Assignment has no questions') {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
