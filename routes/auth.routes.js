const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const {
  signup,
  verifyEmail,
  login,
  setupInstitution,
  googleCallback,
  setPassword,
  updateSettings,
  changePassword,
  getMe,
  getSettings
} = require('../controllers/auth.controller');
const { signupValidation } = require('../middleware/validate.middleware');
const { protect, allowRoles } = require('../middleware/auth.middleware');

router.post('/signup', signupValidation, signup);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/set-password', setPassword);
router.post('/institution', protect, setupInstitution);
router.put('/settings', protect, allowRoles('super_admin', 'admin'), updateSettings);
router.put('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.get('/settings', protect, allowRoles('super_admin', 'admin'), getSettings);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
  googleCallback
);

module.exports = router;