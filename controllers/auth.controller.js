const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Institution = require('../models/Institution');
const { generateAccessToken, generateVerificationToken } = require('../utils/generateToken');
const { sendVerificationEmail } = require('../utils/sendEmail');

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashed, role: 'super_admin' });

    const verificationToken = generateVerificationToken(user._id);
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // send response immediately — don't wait for email
    res.status(201).json({ message: 'Account created. Check your email to verify your account.' });

    // send email after response — failure won't affect the user
    sendVerificationEmail(email, verificationToken).catch(err => {
      console.error('Email send failed:', err.message);
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// GET /api/auth/verify-email?token=...
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
    if (user.verificationTokenExpiry < Date.now()) {
      return res.status(400).json({ message: 'Verification link expired' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/institution (Step 1 of registration)
const setupInstitution = async (req, res) => {
  try {
    const { name, type, estimatedLearners, country } = req.body;

    const institution = await Institution.create({
      name, type, estimatedLearners, country,
      owner: req.user._id
    });

    req.user.institution = institution._id;
    await req.user.save();

    res.status(201).json({ message: 'Institution created', institution });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/set-password
const setPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(password, 12);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Google OAuth callback handler
const googleCallback = (req, res) => {
  const accessToken = generateAccessToken(req.user._id);
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
};

module.exports = { 
  signup, 
  verifyEmail, 
  login, 
  setupInstitution, 
  googleCallback, 
  setPassword 
};