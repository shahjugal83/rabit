const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.FROM_EMAIL;
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

async function sendVerificationEmail(email, token) {
  try {
    const link = `${frontendBaseUrl}/verify.php?token=${token}`;
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Email Verification - SaaS Application',
      text:
        `Click the link below to verify your email:\n\n${link}\n\n` +
        `This link will expire in 1 hour.\n\n` +
        `If you didn't register, please ignore this email.`,
    });
    console.log(`Verification email sent to: ${email}`);
  } catch (err) {
    console.error(`Failed to send verification email to: ${email}`, err);
  }
}

async function sendPasswordResetEmail(email, token) {
  try {
    const link = `${frontendBaseUrl}/reset-password.php?token=${token}`;
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Password Reset - SaaS Application',
      text:
        `Click the link below to reset your password:\n\n${link}\n\n` +
        `This link will expire in 1 hour.\n\n` +
        `If you didn't request this, please ignore this email.`,
    });
    console.log(`Password reset email sent to: ${email}`);
  } catch (err) {
    console.error(`Failed to send password reset email to: ${email}`, err);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
