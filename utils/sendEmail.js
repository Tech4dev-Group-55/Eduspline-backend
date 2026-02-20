const transporter = require('../config/nodemailer');

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"EduSpline Platform" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Verify your account',
    html: `
      <h2>Welcome to EduSpline</h2>
      <p>Click the link below to verify your account. This link expires in 24 hours.</p>
      <a href="${link}" style="padding:20px 30px;background:#4F46E5;color:white;border-radius:5px;text-decoration:none;">
        Verify Account
      </a>
    `
  });
};

const sendInviteEmail = async (to, token, inviterName) => {
  const link = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;
  await transporter.sendMail({
    from: `"EduSpline Platform" <${process.env.GMAIL_USER}>`,
    to,
    subject: `You've been invited to join EduSpline`,
    html: `
      <h2>You've been invited</h2>
      <p>${inviterName} has invited you to join their institution on EduSpline.</p>
      <p>Click below to accept. This invite expires in 48 hours.</p>
      <a href="${link}" style="padding:20px 30px;background:#4F46E5;color:white;border-radius:5px;text-decoration:none;">
        Accept Invite
      </a>
    `
  });
};

// small delay between sends to avoid Gmail spam flagging
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendBulkInviteEmails = async (recipients, inviterName) => {
  const results = { sent: [], failed: [] };

  for (const { email, token } of recipients) {
    try {
      await sendInviteEmail(email, token, inviterName);
      results.sent.push(email);
      await delay(300); // 300ms between each send
    } catch (err) {
      results.failed.push({ email, reason: 'Email delivery failed' });
    }
  }

  return results;
};

module.exports = { sendVerificationEmail, sendInviteEmail, sendBulkInviteEmails };