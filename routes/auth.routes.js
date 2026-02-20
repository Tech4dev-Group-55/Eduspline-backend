const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { 
  signup, 
  verifyEmail, 
  login, 
  setupInstitution, 
  googleCallback,
  setPassword
} = require('../controllers/auth.controller');
const { signupValidation } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', signupValidation, signup);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/set-password', setPassword);
router.post('/institution', protect, setupInstitution);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
  googleCallback
);

module.exports = router;