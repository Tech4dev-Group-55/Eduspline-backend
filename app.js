const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth.routes');
const teamRoutes = require('./routes/team.routes');
const predictionRoutes = require('./routes/prediction.routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later'
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/predictions', predictionRoutes);

module.exports = app;