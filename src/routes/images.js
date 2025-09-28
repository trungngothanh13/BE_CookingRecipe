// src/routes/images.js
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('./auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for temporary file storage
const upload = multer({
  dest: 'temp/', // Temporary directory
  limits: {
    fileSize: 5 * 1024 * 1024,
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

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Upload recipe image
 *     description: Upload an image for a recipe with automatic optimization
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
 *                 description: Image file to upload
 *               recipeId:
 *                 type: integer
 *                 description: Recipe ID to associate with image
 *               isTitleImage:
 *                 type: boolean
 *                 description: Whether this is the main recipe image
 *               altText:
 *                 type: string
 *                 description: Alt text for accessibility
 *           example:
 *             image: "[binary file data - select a JPG/PNG file]"
 *             recipeId: 1
 *             isTitleImage: true
 *             altText: "Delicious homemade pizza with fresh basil"
 *     responses:
 *       201:
 *         description: Image uploaded successfully
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
 *                     imageId:
 *                       type: integer
 *                     imageUrl:
 *                       type: string
 *                     thumbnailUrl:
 *                       type: string
 *                     publicId:
 *                       type: string
 */
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { recipeId, isTitleImage = false, altText } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Verify recipe exists and user owns it (if recipeId provided)
    if (recipeId) {
      const recipeCheck = await client.query(
        'SELECT userid FROM Recipe WHERE recipeid = $1',
        [recipeId]
      );

      if (recipeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Recipe not found'
        });
      }

      if (recipeCheck.rows[0].userid !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only upload images for your own recipes'
        });
      }
    }

    // Upload to Cloudinary with transformations
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'recipes',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 900, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' } // Automatically choose best format (WebP, etc.)
      ],
      // Generate multiple sizes
      eager: [
        { width: 400, height: 300, crop: 'fill', gravity: 'center' }, // Thumbnail
        { width: 800, height: 600, crop: 'fill', gravity: 'center' }  // Medium
      ]
    });

    // Clean up temporary file
    await fs.unlink(req.file.path);

    // Start transaction
    await client.query('BEGIN');

    // If this is set as title image, unset other title images for this recipe
    if (recipeId && isTitleImage === 'true') {
      await client.query(`
        UPDATE Image SET IsTitleImage = false 
        WHERE imageid IN (
          SELECT ri.imageid FROM Recipe_Image ri WHERE ri.recipeid = $1
        )
      `, [recipeId]);
    }

    // Insert image record
    const imageResult = await client.query(`
      INSERT INTO Image (ImageURL, ImageAlt, IsTitleImage) 
      VALUES ($1, $2, $3) 
      RETURNING ImageID, ImageURL, ImageAlt, IsTitleImage
    `, [
      uploadResult.secure_url,
      altText || 'Recipe image',
      isTitleImage === 'true'
    ]);

    const newImage = imageResult.rows[0];

    // Link to recipe if recipeId provided
    if (recipeId) {
      await client.query(
        'INSERT INTO Recipe_Image (RecipeID, ImageID) VALUES ($1, $2)',
        [recipeId, newImage.imageid]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // Prepare response with different image sizes
    const responseData = {
      imageId: newImage.imageid,
      imageUrl: uploadResult.secure_url,
      thumbnailUrl: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
      mediumUrl: uploadResult.eager?.[1]?.secure_url || uploadResult.secure_url,
      publicId: uploadResult.public_id,
      altText: newImage.imagealt,
      isTitleImage: newImage.istitleimage
    };

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: responseData
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Image upload error:', error);
    
    // Clean up temporary file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/images/recipe/{recipeId}:
 *   get:
 *     summary: Get images for a recipe
 *     description: Retrieve all images associated with a specific recipe
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recipe images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       imageUrl:
 *                         type: string
 *                         example: "https://res.cloudinary.com/example/image/upload/v1234567/recipes/image1.jpg"
 *                       altText:
 *                         type: string
 *                         example: "Delicious pasta dish"
 *                       isTitleImage:
 *                         type: boolean
 *                         example: true
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2023-11-15T10:30:00Z"
 *                 count:
 *                   type: integer
 *                   example: 3
 */
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID'
      });
    }

    const query = `
      SELECT 
        i.ImageID as id,
        i.ImageURL as imageUrl,
        i.ImageAlt as altText,
        i.IsTitleImage as isTitleImage,
        i.UploadedAt as uploadedAt
      FROM Recipe_Image ri
      JOIN Image i ON ri.ImageID = i.ImageID
      WHERE ri.RecipeID = $1
      ORDER BY i.IsTitleImage DESC, i.UploadedAt ASC
    `;

    const result = await pool.query(query, [recipeId]);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe images',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/images/{imageId}:
 *   delete:
 *     summary: Delete an image
 *     description: Delete an image from both database and Cloudinary (user must own the associated recipe)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         description: Image ID to delete
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                   example: 'Image deleted successfully'
 */
router.delete('/:imageId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const imageId = parseInt(req.params.imageId);
    const userId = req.user.userId;

    if (isNaN(imageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID'
      });
    }

    // Check if user owns a recipe that has this image
    const ownershipCheck = await client.query(`
      SELECT i.ImageURL, r.RecipeTitle
      FROM Image i
      JOIN Recipe_Image ri ON i.ImageID = ri.ImageID
      JOIN Recipe r ON ri.RecipeID = r.RecipeID
      WHERE i.ImageID = $1 AND r.UserID = $2
    `, [imageId, userId]);

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete images from your own recipes'
      });
    }

    const imageUrl = ownershipCheck.rows[0].imageurl;
    
    // Extract public_id from Cloudinary URL for deletion
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Start transaction
    await client.query('BEGIN');

    // Delete from database (CASCADE will handle Recipe_Image)
    await client.query('DELETE FROM Image WHERE ImageID = $1', [imageId]);

    // Commit transaction
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Image deletion error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
});

module.exports = router;