/*
=======================================================================================================================================
Application Configuration
=======================================================================================================================================
Purpose: Centralizes all configuration values from environment variables.
         Import this file instead of accessing process.env directly throughout the app.
Usage: const config = require('./config/config');
       const secret = config.jwt.secret;
=======================================================================================================================================
*/

require('dotenv').config();

const config = {
  // Server settings
  port: process.env.PORT || 3016,
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS settings - split comma-separated URLs into array
  clientUrl: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:3000'],

  // JWT authentication settings
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Security settings
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,

  // Email settings (Resend)
  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    name: process.env.EMAIL_NAME,
    verificationUrl: process.env.EMAIL_VERIFICATION_URL,
  },

  // Stripe billing settings
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceMonthly: process.env.STRIPE_PRICE_MONTHLY,
    priceAnnual: process.env.STRIPE_PRICE_ANNUAL,
  },

  // Logging
  checkApiCall: process.env.CHECK_API_CALL === 'YES',
};

module.exports = config;
