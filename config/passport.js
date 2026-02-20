const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (user) {
      // If user exists (including invited), link Google account and mark verified
      if (!user.googleId) {
        user.googleId = profile.id;
        user.isVerified = true;
        await user.save();
      }
      return done(null, user);
    }

    // New user via Google — create account, still needs institution setup
    user = await User.create({
      name: profile.displayName,
      email,
      googleId: profile.id,
      isVerified: true,
      role: 'super_admin'
    });

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

module.exports = passport;