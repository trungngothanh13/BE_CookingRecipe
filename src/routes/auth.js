const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/auth.js and src/docs/schemas.js

router.post('/register', async (req, res) => {
  try {
    const { username, password, profilePicture } = req.body;

    const { user, token } = await authService.registerUser(username, password, profilePicture);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error types
    if (error.message.includes('required') || 
        error.message.includes('characters') || 
        error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { user, token } = await authService.loginUser(username, password);

    res.json({
      success: true,
      message: 'Login successful',
      user,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle authentication errors
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // req.user is set by the authenticateToken middleware
    const user = await authService.getUserProfile(req.user.userId);

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export router
module.exports = router;