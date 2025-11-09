// src/routes/images.js
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const router = express.Router();
const imageService = require('../services/imageService');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/images.js

// Configure multer for temporary file storage
const upload = multer({
  dest: 'temp/', // Temporary directory
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});


router.post('/profile', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.userId;
    const result = await imageService.uploadProfilePicture(userId, req.file.path);

    // Clean up temporary file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: result
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    
    // Clean up temporary file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        // Cleanup error - file may not exist, continue
      }
    }

    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


router.post('/recipe-thumbnail', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    const recipeIdInt = parseInt(recipeId);
    if (isNaN(recipeIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const result = await imageService.uploadRecipeThumbnail(recipeIdInt, req.file.path);

    // Clean up temporary file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      message: 'Video thumbnail uploaded successfully',
      data: result
    });

  } catch (error) {
    console.error('Video thumbnail upload error:', error);
    
    // Clean up temporary file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        // Cleanup error - file may not exist, continue
      }
    }

    if (error.message === 'Recipe not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload video thumbnail',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
