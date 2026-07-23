const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

function getFrontendBaseUrl(req) {
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    return `${protocol}://${host}`;
  }
  return process.env.FRONTEND_BASE_URL || 'http://localhost:3001';
}

async function sendVerificationEmail(email, token, req) {
  try {
    const frontendBaseUrl = getFrontendBaseUrl(req);
    const link = `${frontendBaseUrl}/verify.html?token=${token}`;
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Email Verification - SaaS Application',
      html:
        `<p>Click the link below to verify your email:</p>` +
        `<p><a href="${link}">${link}</a></p>` +
        `<p>This link will expire in 1 hour.</p>` +
        `<p>If you didn't register, please ignore this email.</p>`,
    });
    console.log(`Verification email sent to: ${email}`);
  } catch (err) {
    console.error(`Failed to send verification email to: ${email}`, err);
  }
}

async function sendPasswordResetEmail(email, token, req) {
  try {
    const frontendBaseUrl = getFrontendBaseUrl(req);
    const link = `${frontendBaseUrl}/reset-password.html?token=${token}`;
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Password Reset - SaaS Application',
      html:
        `<p>Click the link below to reset your password:</p>` +
        `<p><a href="${link}">${link}</a></p>` +
        `<p>This link will expire in 1 hour.</p>` +
        `<p>If you didn't request this, please ignore this email.</p>`,
    });
    console.log(`Password reset email sent to: ${email}`);
  } catch (err) {
    console.error(`Failed to send password reset email to: ${email}`, err);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
