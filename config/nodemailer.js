const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '74.125.24.108', // Gmail SMTP direct IP — bypasses IPv6 DNS
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = transporter;