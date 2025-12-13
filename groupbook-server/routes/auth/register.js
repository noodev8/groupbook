/*
=======================================================================================================================================
API Route: register
=======================================================================================================================================
Method: POST
Purpose: Creates a new user account for a restaurant. Returns a JWT token and user details upon success.
=======================================================================================================================================
Request Payload:
{
  "email": "user@example.com",         // string, required
  "password": "securepassword123",     // string, required, min 6 characters
  "restaurant_name": "The Good Fork"   // string, required
}

Success Response:
{
  "return_code": "SUCCESS",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // string, JWT token for auth
  "user": {
    "id": 123,                         // integer, unique user ID
    "email": "user@example.com",       // string, user's email
    "restaurant_name": "The Good Fork" // string, restaurant name
  }
}
=======================================================================================================================================
Return Codes:
"SUCCESS"
"MISSING_FIELDS"
"INVALID_EMAIL"
"INVALID_PASSWORD"
"EMAIL_EXISTS"
"SERVER_ERROR"
=======================================================================================================================================
*/

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { query } = require('../../database');
const config = require('../../config/config');
const { logApiCall } = require('../../utils/apiLogger');

router.post('/register', async (req, res) => {
  logApiCall('register');

  try {
    const { email, password, restaurant_name } = req.body;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!email || !password || !restaurant_name) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Email, password, and restaurant name are required',
      });
    }

    // ---------------------------------------------------------------
    // Validate email format
    // Simple regex check for basic email structure
    // ---------------------------------------------------------------
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({
        return_code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address',
      });
    }

    // ---------------------------------------------------------------
    // Validate password strength
    // Minimum 6 characters for MVP simplicity
    // ---------------------------------------------------------------
    if (password.length < 6) {
      return res.json({
        return_code: 'INVALID_PASSWORD',
        message: 'Password must be at least 6 characters long',
      });
    }

    // ---------------------------------------------------------------
    // Check if email already exists
    // ---------------------------------------------------------------
    const existingUser = await query(
      'SELECT id FROM app_user WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.json({
        return_code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    // ---------------------------------------------------------------
    // Hash the password using bcrypt
    // ---------------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // ---------------------------------------------------------------
    // Insert new user into database
    // ---------------------------------------------------------------
    const insertResult = await query(
      `INSERT INTO app_user (email, password_hash, restaurant_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, restaurant_name`,
      [email.toLowerCase().trim(), passwordHash, restaurant_name.trim()]
    );

    const newUser = insertResult.rows[0];

    // ---------------------------------------------------------------
    // Generate JWT token for immediate login after registration
    // ---------------------------------------------------------------
    const token = jwt.sign(
      { app_user_id: newUser.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // ---------------------------------------------------------------
    // Return success response with token and user details
    // ---------------------------------------------------------------
    return res.json({
      return_code: 'SUCCESS',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        restaurant_name: newUser.restaurant_name,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
