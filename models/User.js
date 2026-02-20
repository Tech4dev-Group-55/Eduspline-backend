const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'instructor', 'student'],
    default: 'admin'
  },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  isVerified: { type: Boolean, default: false },
  isInvited: { type: Boolean, default: false },
  googleId: { type: String },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  inviteToken: { type: String },
  inviteTokenExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);