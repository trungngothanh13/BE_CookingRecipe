const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const SALT_ROUNDS = 10; // Increased for better security
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token for user
 * @param {number} userId - User ID
 * @param {string} username - Username
 * @param {string} role - User role ('user' or 'admin')
 * @returns {string} JWT token
 */
function generateToken(userId, username, role) {
  return jwt.sign(
    { 
      userId, 
      username,
      role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Register a new user
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @param {string} profilePicture - Optional profile picture URL
 * @returns {Promise<Object>} User data and token
 * @throws {Error} If validation fails or user already exists
 */
async function registerUser(username, password, profilePicture = null, name = null, email = null) {
  // Validation
  if (!username || !password || !name || !email) {
    throw new Error('Name, email, username and password are required');
  }

  if (username.length < 3 || username.length > 50) {
    throw new Error('Username must be between 3 and 50 characters');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('A valid email is required');
  }

  // Check if username already exists
  const existingUser = await pool.query(
    'SELECT userid FROM "User" WHERE username = $1 OR LOWER(email) = $2',
    [username, normalizedEmail]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Username or email already exists');
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Insert new user (default role is 'user')
  const result = await pool.query(
    `INSERT INTO "User" (username, name, email, password, profilepicture)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING userid, username, name, email, profilepicture, role`,
    [username, String(name).trim(), normalizedEmail, hashedPassword, profilePicture]
  );

  const newUser = result.rows[0];

  // Generate JWT token
  const token = generateToken(newUser.userid, newUser.username, newUser.role);

  return {
    user: {
      id: newUser.userid,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      profilePicture: newUser.profilepicture,
      role: newUser.role
    },
    token
  };
}

/**
 * Authenticate user login
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} User data and token
 * @throws {Error} If credentials are invalid
 */
async function loginUser(username, password) {
  // Validation
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // Find user in database
  const result = await pool.query(
    'SELECT userid, username, name, email, password, profilepicture, role FROM "User" WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = result.rows[0];

  // Compare password with hash
  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid username or password');
  }

  // Generate JWT token
  const token = generateToken(user.userid, user.username, user.role);

  return {
    user: {
      id: user.userid,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePicture: user.profilepicture,
      role: user.role
    },
    token
  };
}

/**
 * Get user profile by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile data
 * @throws {Error} If user not found
 */
async function getUserProfile(userId) {
  const result = await pool.query(
    'SELECT userid, username, name, email, profilepicture, role, createdat FROM "User" WHERE userid = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  return {
    id: user.userid,
    username: user.username,
    name: user.name,
    email: user.email,
    profilePicture: user.profilepicture,
    role: user.role,
    createdAt: user.createdat
  };
}

async function updateUserProfile(userId, payload = {}) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();

  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('A valid email is required');
  }

  const existing = await pool.query(
    'SELECT userid FROM "User" WHERE LOWER(email) = $1 AND userid <> $2 LIMIT 1',
    [email, userId]
  );
  if (existing.rows.length > 0) {
    throw new Error('Email already exists');
  }

  const updated = await pool.query(
    `UPDATE "User"
     SET name = $1, email = $2, updatedat = NOW()
     WHERE userid = $3
     RETURNING userid, username, name, email, profilepicture, role, createdat`,
    [name, email, userId]
  );

  if (updated.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = updated.rows[0];
  return {
    id: user.userid,
    username: user.username,
    name: user.name,
    email: user.email,
    profilePicture: user.profilepicture,
    role: user.role,
    createdAt: user.createdat
  };
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  generateToken,
  hashPassword,
  comparePassword
};

