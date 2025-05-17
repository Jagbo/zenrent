const nodemailer = require('nodemailer');

// Create a test account using Inbucket's SMTP
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2500, // Inbucket SMTP port
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

// Setup email data
const mailOptions = {
  from: 'test@example.com',
  to: 'j.agbodo@gmail.com',
  subject: 'Test Password Reset Link',
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Reset your password</h1>
      <p style="margin: 20px 0; font-size: 16px; color: #555;">
        This is a test email with a reset link.
      </p>
      <a href="http://localhost:3005/reset-password?token=test-token" style="display: inline-block; background-color: #D9E8FF; color: #333; font-weight: bold; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0;">
        Reset Password
      </a>
    </div>
  `
};

// Send mail
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail(); 