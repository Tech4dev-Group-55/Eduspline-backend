const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendVerificationEmail = async (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.to = [{ email: to }];
  email.sender = { name: 'EduSpline Platform', email: process.env.BREVO_SENDER };
  email.subject = 'Verify your account';
  email.htmlContent = `
    <h2>Welcome to EduSpline</h2>
    <p>Click the link below to verify your account. This link expires in 24 hours.</p>
    <a href="${link}" style="padding:10px 20px;background:#4F46E5;color:white;border-radius:5px;text-decoration:none;">
      Verify Account
    </a>
  `;

  await transactionalApi.sendTransacEmail(email);
};

const sendInviteEmail = async (to, token, inviterName) => {
  const link = `${process.env.CLIENT_URL}/accept-invite?token=${token}`;

  const email = new SibApiV3Sdk.SendSmtpEmail();
  email.to = [{ email: to }];
  email.sender = { name: 'EduSpline Platform', email: process.env.BREVO_SENDER };
  email.subject = `You've been invited to join EduSpline`;
  email.htmlContent = `
    <h2>You've been invited</h2>
    <p>${inviterName} has invited you to join their institution on EduSpline.</p>
    <p>Click below to accept. This invite expires in 48 hours.</p>
    <a href="${link}" style="padding:10px 20px;background:#4F46E5;color:white;border-radius:5px;text-decoration:none;">
      Accept Invite
    </a>
  `;

  await transactionalApi.sendTransacEmail(email);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendBulkInviteEmails = async (recipients, inviterName) => {
  const results = { sent: [], failed: [] };

  for (const { email, token } of recipients) {
    try {
      await sendInviteEmail(email, token, inviterName);
      results.sent.push(email);
      await delay(300);
    } catch (err) {
      results.failed.push({ email, reason: 'Email delivery failed' });
    }
  }

  return results;
};

module.exports = { sendVerificationEmail, sendInviteEmail, sendBulkInviteEmails };