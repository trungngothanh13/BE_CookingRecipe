const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const router = express.Router();
const transactionService = require('../services/transactionService');
const imageService = require('../services/imageService');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Swagger documentation: see src/docs/transactions.js

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

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const transaction = await transactionService.createTransaction(userId);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully. Please submit payment proof.',
      data: transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    
    if (error.message === 'Cart is empty') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;
    const transactions = await transactionService.getUserTransactions(userId, status);

    res.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin route - must come before /:id to avoid route conflict
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    
    const result = await transactionService.getAllTransactions({
      status: status || null,
      userId: userId ? parseInt(userId) : null,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id/payment', authenticateToken, upload.single('paymentProof'), async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { paymentMethod } = req.body;

    if (isNaN(transactionId)) {
      // Clean up file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          // Continue
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }

    // Validate payment method
    if (!paymentMethod || paymentMethod.trim().length === 0) {
      // Clean up file if it exists
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          // Continue
        }
      }
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof image is required'
      });
    }

    // Upload payment proof image to Cloudinary
    let paymentProofUrl;
    try {
      const uploadResult = await imageService.uploadPaymentProof(req.file.path);
      paymentProofUrl = uploadResult.imageUrl;
    } catch (uploadError) {
      // Clean up temporary file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        // Continue
      }
      throw new Error('Failed to upload payment proof image');
    }

    // Clean up temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      // Cleanup error - file may not exist, continue
    }

    // Submit payment with the image URL
    const transaction = await transactionService.submitPayment(
      transactionId,
      userId,
      paymentMethod.trim(),
      paymentProofUrl
    );

    res.json({
      success: true,
      message: 'Payment proof submitted successfully. Waiting for admin verification.',
      data: transaction
    });

  } catch (error) {
    console.error('Submit payment error:', error);
    
    // Clean up temporary file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        // Cleanup error - file may not exist, continue
      }
    }
    
    if (error.message === 'Transaction not found' || 
        error.message.includes('do not have permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('required') || 
        error.message.includes('Cannot submit payment') ||
        error.message.includes('Only image files')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit payment proof',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const adminId = req.user.userId;
    const { adminNotes } = req.body;

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }

    const result = await transactionService.verifyTransaction(
      transactionId,
      adminId,
      adminNotes
    );

    res.json({
      success: true,
      message: 'Transaction verified successfully. Purchase entries created.',
      data: result
    });

  } catch (error) {
    console.error('Verify transaction error:', error);
    
    if (error.message === 'Transaction not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already') || 
        error.message.includes('Cannot verify')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to verify transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const adminId = req.user.userId;
    const { adminNotes } = req.body;

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }

    const result = await transactionService.rejectTransaction(
      transactionId,
      adminId,
      adminNotes
    );

    res.json({
      success: true,
      message: 'Transaction rejected successfully',
      data: result
    });

  } catch (error) {
    console.error('Reject transaction error:', error);
    
    if (error.message === 'Transaction not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('required') || 
        error.message.includes('already') ||
        error.message.includes('Cannot reject')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reject transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
