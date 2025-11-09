const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const pool = require('../config/database');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to temporary file
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function uploadToCloudinary(filePath, options = {}) {
  return await cloudinary.uploader.upload(filePath, options);
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFromCloudinary(publicId) {
  return await cloudinary.uploader.destroy(publicId);
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null if not a Cloudinary URL
 */
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }
  
  try {
    const urlParts = url.split('/');
    const publicIdWithExt = urlParts.slice(-2).join('/');
    return publicIdWithExt.split('.')[0];
  } catch (error) {
    // Error extracting public ID - continue without cleanup
    return null;
  }
}

/**
 * Upload profile picture for user
 * @param {number} userId - User ID
 * @param {string} filePath - Path to temporary file
 * @returns {Promise<Object>} Upload result with imageUrl and publicId
 * @throws {Error} If user not found
 */
async function uploadProfilePicture(userId, filePath) {
  const client = await pool.connect();
  
  try {
    // Get current profile picture
    const userResult = await client.query(
      'SELECT profilepicture FROM "User" WHERE userid = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const oldProfilePicture = userResult.rows[0].profilepicture;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(filePath, {
      folder: 'profiles',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    // Start transaction
    await client.query('BEGIN');

    // Update user profile picture
    await client.query(
      'UPDATE "User" SET profilepicture = $1 WHERE userid = $2',
      [uploadResult.secure_url, userId]
    );

    // Commit transaction
    await client.query('COMMIT');

    // Delete old profile picture from Cloudinary if it exists
    if (oldProfilePicture) {
      const oldPublicId = extractPublicId(oldProfilePicture);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (deleteError) {
          // Error deleting old profile picture - continue
          // Don't fail the request if deletion fails
        }
      }
    }

    return {
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Upload video thumbnail for recipe (admin only)
 * @param {number} recipeId - Recipe ID
 * @param {string} filePath - Path to temporary file
 * @returns {Promise<Object>} Upload result with imageUrl, thumbnailUrl and publicId
 * @throws {Error} If recipe not found
 */
async function uploadRecipeThumbnail(recipeId, filePath) {
  const client = await pool.connect();
  
  try {
    // Get current thumbnail
    const recipeResult = await client.query(
      'SELECT videothumbnail FROM Recipe WHERE recipeid = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    const oldThumbnail = recipeResult.rows[0].videothumbnail;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(filePath, {
      folder: 'thumbnails',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 675, crop: 'fill', quality: 'auto:good' }, // 16:9 aspect ratio
        { fetch_format: 'auto' }
      ],
      // Generate thumbnail size
      eager: [
        { width: 400, height: 225, crop: 'fill' } // Smaller thumbnail
      ]
    });

    // Start transaction
    await client.query('BEGIN');

    // Update recipe video thumbnail
    await client.query(
      'UPDATE Recipe SET videothumbnail = $1 WHERE recipeid = $2',
      [uploadResult.secure_url, recipeId]
    );

    // Commit transaction
    await client.query('COMMIT');

    // Delete old thumbnail from Cloudinary if it exists
    if (oldThumbnail) {
      const oldPublicId = extractPublicId(oldThumbnail);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (deleteError) {
          // Error deleting old thumbnail - continue
          // Don't fail the request if deletion fails
        }
      }
    }

    return {
      imageUrl: uploadResult.secure_url,
      thumbnailUrl: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
      publicId: uploadResult.public_id
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Upload payment proof image for transaction
 * @param {string} filePath - Path to temporary file
 * @returns {Promise<Object>} Upload result with imageUrl and publicId
 */
async function uploadPaymentProof(filePath) {
  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(filePath, {
    folder: 'payment-proofs',
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });

  return {
    imageUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id
  };
}

/**
 * Verify user owns recipe (for authorization checks)
 * @param {number} recipeId - Recipe ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user owns the recipe
 */
async function verifyRecipeOwnership(recipeId, userId) {
  const result = await pool.query(
    'SELECT userid FROM Recipe WHERE recipeid = $1',
    [recipeId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].userid === userId;
}

module.exports = {
  uploadProfilePicture,
  uploadRecipeThumbnail,
  uploadPaymentProof,
  verifyRecipeOwnership,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};

