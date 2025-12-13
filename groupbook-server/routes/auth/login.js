/*
=======================================================================================================================================
API Route: login
=======================================================================================================================================
Method: POST
Purpose: Authenticates a user using their email and password. Returns a JWT token and basic user details upon success.
=======================================================================================================================================
Request Payload:
{
  "email": "user@example.com",         // string, required
  "password": "securepassword123"      // string, required
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
"INVALID_CREDENTIALS"
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

router.post('/login', async (req, res) => {
  logApiCall('login');

  try {
    const { email, password } = req.body;

    // ---------------------------------------------------------------
    // Validate required fields
    // ---------------------------------------------------------------
    if (!email || !password) {
      return res.json({
        return_code: 'MISSING_FIELDS',
        message: 'Email and password are required',
      });
    }

    // ---------------------------------------------------------------
    // Look up user by email
    // ---------------------------------------------------------------
    const userResult = await query(
      'SELECT id, email, password_hash, restaurant_name FROM app_user WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    // Check if user exists
    if (userResult.rows.length === 0) {
      return res.json({
        return_code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const user = userResult.rows[0];

    // ---------------------------------------------------------------
    // Verify password against stored hash
    // ---------------------------------------------------------------
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.json({
        return_code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // ---------------------------------------------------------------
    // Generate JWT token
    // Only store app_user_id in the token as per API rules
    // ---------------------------------------------------------------
    const token = jwt.sign(
      { app_user_id: user.id },
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
        id: user.id,
        email: user.email,
        restaurant_name: user.restaurant_name,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.json({
      return_code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  }
});

module.exports = router;
