const nodemailer = require("nodemailer");

/**
 * Create nodemailer transporter
 * @returns {Object} - Nodemailer transporter
 */
const createTransporter = () => {
  // For production, use real email service
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: "youssef.m.hammoud.01@gmail.com",
        pass: "mwys rxws aeex hzuz",
      },
    });
  }

  // For development, use ethereal test account
  // Or return the production config if environment variables are set
  if ("youssef.m.hammoud.01@gmail.com" && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: "youssef.m.hammoud.01@gmail.com",
        pass: "mwys rxws aeex hzuz",
      },
    });
  }

  // Fallback to console logging in development
  return {
    sendMail: async (mailOptions) => {
      console.log("Email sent in development mode:");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("Text:", mailOptions.text);
      console.log("HTML:", mailOptions.html);

      return {
        messageId: "dev-mode-" + Date.now(),
        response: "Development mode - email not sent",
      };
    },
  };
};

/**
 * Send an email
 * @param {Object} mailOptions - Email options
 * @returns {Promise} - Result of sending email
 */
const sendEmail = async (mailOptions) => {
  try {
    const transporter = createTransporter();

    // Set default from address if not provided
    if (!mailOptions.from) {
      mailOptions.from =
        process.env.EMAIL_FROM || "noreply@creativecontent.com";
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

/**
 * Send verification email
 * @param {String} email - Recipient email address
 * @param {String} token - Verification token
 * @returns {Promise} - Result of sending email
 */
const sendVerificationEmail = async (email, token) => {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://creativecontent.com"
      : "http://localhost:3000";

  const verificationUrl = `${baseUrl}/verify-email/${token}`;

  const mailOptions = {
    to: email,
    subject: "Email Verification - Creative Content Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Thank you for registering with our Creative Content Platform. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">Creative Content Platform - Connect with photographers and videographers</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send password reset email
 * @param {String} email - Recipient email address
 * @param {String} token - Reset token
 * @returns {Promise} - Result of sending email
 */
const sendPasswordResetEmail = async (email, token) => {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://creativecontent.com"
      : "http://localhost:3000";

  const resetUrl = `${baseUrl}/reset-password/${token}`;

  const mailOptions = {
    to: email,
    subject: "Password Reset - Creative Content Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your Creative Content Platform account. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">Creative Content Platform - Connect with photographers and videographers</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send welcome email
 * @param {String} email - Recipient email address
 * @param {String} firstName - Recipient's first name
 * @returns {Promise} - Result of sending email
 */
const sendWelcomeEmail = async (email, firstName) => {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://creativecontent.com"
      : "http://localhost:3000";

  const mailOptions = {
    to: email,
    subject: "Welcome to Creative Content Platform!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${firstName}!</h2>
        <p>Thank you for joining our Creative Content Platform. We're excited to have you onboard!</p>
        <p>With our platform, you can:</p>
        <ul>
          <li>Connect with talented photographers and videographers</li>
          <li>Showcase your creative work</li>
          <li>Find clients for your services</li>
          <li>Build your professional network</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/dashboard" style="background-color: #673AB7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get Started</a>
        </div>
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">Creative Content Platform - Connect with photographers and videographers</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

/**
 * Send notification email when a user receives a message
 * @param {String} email - Recipient email address
 * @param {String} firstName - Recipient's first name
 * @param {String} senderName - Name of the message sender
 * @returns {Promise} - Result of sending email
 */
const sendMessageNotificationEmail = async (email, firstName, senderName) => {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://creativecontent.com"
      : "http://localhost:3000";

  const mailOptions = {
    to: email,
    subject: "New Message on Creative Content Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello, ${firstName}!</h2>
        <p>You have received a new message from <strong>${senderName}</strong> on the Creative Content Platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/messages" style="background-color: #FF5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Message</a>
        </div>
        <p>To respond to this message, please log in to your account.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">Creative Content Platform - Connect with photographers and videographers</p>
      </div>
    `,
  };

  return await sendEmail(mailOptions);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendMessageNotificationEmail,
};
