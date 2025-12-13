/*
=======================================================================================================================================
Authentication Middleware
=======================================================================================================================================
Purpose: Provides JWT authentication middleware for protecting routes.
         - verifyToken: Requires valid JWT, rejects if missing/invalid
         - optionalAuth: Attaches user if token present, continues if not
Usage:
  const { verifyToken, optionalAuth } = require('../middleware/auth');
  router.post('/protected', verifyToken, handler);
  router.get('/public', optionalAuth, handler);
=======================================================================================================================================
*/

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/*
 * verifyToken - Middleware that requires a valid JWT token
 * Extracts app_user_id from the token and attaches it to req.user
 * Returns UNAUTHORIZED if token is missing or invalid
 */
const verifyToken = (req, res, next) => {
  // Get token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      return_code: 'UNAUTHORIZED',
      message: 'No token provided',
    });
  }

  // Extract the token part after "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token and decode its payload
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request object for use in route handlers
    // We only store app_user_id in the token, so that's what we extract
    req.user = {
      id: decoded.app_user_id,
    };

    next();
  } catch (error) {
    // Token is invalid or expired
    return res.json({
      return_code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
};

/*
 * optionalAuth - Middleware that attaches user if token is present
 * Does not reject requests without tokens - allows both authenticated and anonymous access
 * Useful for routes that behave differently for logged-in users
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // If no token provided, continue without user info
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.app_user_id,
    };
  } catch (error) {
    // Invalid token - treat as unauthenticated rather than error
    req.user = null;
  }

  next();
};

module.exports = { verifyToken, optionalAuth };
