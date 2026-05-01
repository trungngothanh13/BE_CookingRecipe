const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');

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

module.exports = router;
