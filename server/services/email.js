const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    // Use ethereal for testing
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test'
      }
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const transporter = createTransporter();

/**
 * Send email helper
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SIMVEX <noreply@simvex.com>',
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * Email templates
 */
const templates = {
  verification: (name, token) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔬 SIMVEX</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${name}!</h2>
          <p>Thanks for joining SIMVEX - the engineering simulation platform. Please verify your email address to get started.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/verify-email.html?token=${token}" class="button">Verify Email</a>
          </p>
          <p style="color: #888; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>© 2025 SIMVEX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (name, token) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔬 SIMVEX</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/reset-password.html?token=${token}" class="button">Reset Password</a>
          </p>
          <p style="color: #888; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2025 SIMVEX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  projectInvitation: (inviterName, projectName, role, token, message) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .project-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
        .role-badge { display: inline-block; background: ${role === 'editor' ? '#10B981' : '#6B7280'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        .message-box { background: #fff3cd; border-radius: 8px; padding: 15px; margin: 20px 0; font-style: italic; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔬 SIMVEX</h1>
        </div>
        <div class="content">
          <h2>You've been invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to collaborate on a project.</p>
          <div class="project-box">
            <h3 style="margin: 0 0 10px 0;">${projectName}</h3>
            <span class="role-badge">${role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}</span>
          </div>
          ${message ? `<div class="message-box">"${message}"</div>` : ''}
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/invite.html?token=${token}" class="button">Accept Invitation</a>
          </p>
          <p style="color: #888; font-size: 14px;">This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>© 2025 SIMVEX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, name, token) => {
  return sendEmail(
    email,
    'Verify your SIMVEX account',
    templates.verification(name, token)
  );
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  return sendEmail(
    email,
    'Reset your SIMVEX password',
    templates.passwordReset(name, token)
  );
};

/**
 * Send project invitation email
 */
const sendProjectInvitation = async (email, inviterName, projectName, role, token, message) => {
  return sendEmail(
    email,
    `${inviterName} invited you to collaborate on ${projectName}`,
    templates.projectInvitation(inviterName, projectName, role, token, message)
  );
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendProjectInvitation
};
