const jwt = require('jsonwebtoken');
const { parse } = require('csv-parse/sync');
const User = require('../models/User');
const { generateInviteToken } = require('../utils/generateToken');
const { sendInviteEmail, sendBulkInviteEmails } = require('../utils/sendEmail');

const VALID_ROLES = ['super_admin', 'admin', 'instructor', 'student'];

// POST /api/team/invite  — manual invite (unchanged)
const inviteTeamMember = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const institutionId = req.user.institution;

    if (!institutionId) {
      return res.status(400).json({ message: 'Complete institution setup first' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists with this email' });

    const inviteToken = generateInviteToken(email, institutionId, role);

    await User.create({
      name,
      email,
      role,
      institution: institutionId,
      isInvited: true,
      inviteToken,
      inviteTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });

    await sendInviteEmail(email, inviteToken, req.user.name || req.user.email);

    res.status(201).json({ message: `Invite sent to ${email}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/team/invite/csv  — csv bulk invite
const csvInviteTeamMembers = async (req, res) => {
  try {
    const institutionId = req.user.institution;

    if (!institutionId) {
      return res.status(400).json({ message: 'Complete institution setup first' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    // parse csv from memory buffer
    let rows;
    try {
      rows = parse(req.file.buffer, {
        columns: true,         // use first row as headers
        skip_empty_lines: true,
        trim: true
      });
    } catch (err) {
      return res.status(400).json({ message: 'Invalid CSV format. Could not parse file.' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty' });
    }

    const skipped = [];
    const toInvite = [];

    for (const row of rows) {
      const name = row.name || row.Name || '';
      const email = (row.email || row.Email || '').toLowerCase().trim();
      const role = (row.role || row.Role || 'student').toLowerCase().trim();

      // validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        skipped.push({ row: name || email || 'unknown', reason: 'Invalid or missing email' });
        continue;
      }

      // validate name
      if (!name) {
        skipped.push({ email, reason: 'Missing name' });
        continue;
      }

      // validate role — default to student if empty or invalid
      const resolvedRole = VALID_ROLES.includes(role) ? role : 'student';

      // check for duplicate in database
      const existing = await User.findOne({ email });
      if (existing) {
        skipped.push({ email, reason: 'Email already exists in the system' });
        continue;
      }

      toInvite.push({ name, email, role: resolvedRole });
    }

    if (toInvite.length === 0) {
      return res.status(400).json({
        message: 'No valid rows found in CSV',
        skipped
      });
    }

    // create users and generate tokens
    const recipients = [];
    for (const member of toInvite) {
      const inviteToken = generateInviteToken(member.email, institutionId, member.role);

      await User.create({
        name: member.name,
        email: member.email,
        role: member.role,
        institution: institutionId,
        isInvited: true,
        inviteToken,
        inviteTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });

      recipients.push({ email: member.email, token: inviteToken });
    }

    // send emails with delay between each
    const emailResults = await sendBulkInviteEmails(
      recipients,
      req.user.name || req.user.email
    );

    // merge email failures into skipped list
    const allSkipped = [
      ...skipped,
      ...emailResults.failed
    ];

    res.status(201).json({
      message: 'CSV processed successfully',
      sent: emailResults.sent.length,
      skipped: allSkipped.length > 0 ? allSkipped : []
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/team/accept-invite (unchanged)
const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_INVITE_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'Invite not found' });
    if (user.inviteTokenExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invite expired. Ask admin to resend.' });
    }

    user.isVerified = true;
    user.isInvited = false;
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    await user.save();

    const { generateAccessToken } = require('../utils/generateToken');
    const accessToken = generateAccessToken(user._id);

    res.json({
      message: 'Invite accepted',
      accessToken,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired invite token' });
  }
};

// GET /api/team (unchanged)
const getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({ institution: req.user.institution })
      .select('-password -inviteToken -verificationToken');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { inviteTeamMember, csvInviteTeamMembers, acceptInvite, getTeamMembers };