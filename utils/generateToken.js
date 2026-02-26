const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role, email) => {
  return jwt.sign(
    { id: userId, role, email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateInviteToken = (email, institutionId, role) => {
  return jwt.sign(
    { email, institutionId, role },
    process.env.JWT_INVITE_SECRET,
    { expiresIn: '48h' }
  );
};

const generateVerificationToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

module.exports = { generateAccessToken, generateInviteToken, generateVerificationToken };