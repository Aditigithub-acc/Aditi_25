const nodemailer = require("nodemailer")
const logger = require("../utils/logger")

class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number.parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      this.verifyConnection()
    } catch (error) {
      logger.error("Failed to initialize email transporter", {
        error: error.message,
        stack: error.stack,
      })
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify()
      logger.info("Email service connected successfully")
    } catch (error) {
      logger.error("Email service connection failed", {
        error: error.message,
      })
    }
  }

  async sendVerificationEmail(email, name, verificationCode) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${verificationCode}`

      const mailOptions = {
        from: {
          name: "User Onboarding App",
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        },
        to: email,
        subject: "Verify Your Email Address",
        html: this.generateVerificationEmailTemplate(name, verificationCode, verificationUrl),
        text: this.generateVerificationEmailText(name, verificationCode, verificationUrl),
      }

      const info = await this.transporter.sendMail(mailOptions)

      logger.info("Verification email sent successfully", {
        to: email,
        messageId: info.messageId,
        verificationCode,
      })

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      logger.error("Failed to send verification email", {
        to: email,
        error: error.message,
        stack: error.stack,
      })

      throw new Error("Failed to send verification email")
    }
  }

  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: {
          name: "User Onboarding App",
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        },
        to: email,
        subject: "Welcome! Your Account is Verified",
        html: this.generateWelcomeEmailTemplate(name),
        text: this.generateWelcomeEmailText(name),
      }

      const info = await this.transporter.sendMail(mailOptions)

      logger.info("Welcome email sent successfully", {
        to: email,
        messageId: info.messageId,
      })

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      logger.error("Failed to send welcome email", {
        to: email,
        error: error.message,
      })

      return {
        success: false,
        error: error.message,
      }
    }
  }

  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`

      const mailOptions = {
        from: {
          name: "User Onboarding App",
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        },
        to: email,
        subject: "Reset Your Password",
        html: this.generatePasswordResetEmailTemplate(name, resetUrl),
        text: this.generatePasswordResetEmailText(name, resetUrl),
      }

      const info = await this.transporter.sendMail(mailOptions)

      logger.info("Password reset email sent successfully", {
        to: email,
        messageId: info.messageId,
      })

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      logger.error("Failed to send password reset email", {
        to: email,
        error: error.message,
      })

      throw new Error("Failed to send password reset email")
    }
  }

  generateVerificationEmailTemplate(name, verificationCode, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .verification-code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Verify Your Email Address</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with our platform. To complete your registration, please verify your email address.</p>
          
          <div class="verification-code">
            <p><strong>Your verification code is:</strong></p>
            <div class="code">${verificationCode}</div>
          </div>
          
          <p>You can also click the button below to verify your account:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p><strong>Important:</strong> This verification code will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} User Onboarding App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }

  generateVerificationEmailText(name, verificationCode, verificationUrl) {
    return `
Hello ${name}!

Thank you for registering with our platform. To complete your registration, please verify your email address.

Your verification code is: ${verificationCode}

You can also visit this link to verify your account: ${verificationUrl}

Important: This verification code will expire in 1 hour for security reasons.

If you didn't create an account with us, please ignore this email.

This is an automated email. Please do not reply to this message.

© ${new Date().getFullYear()} User Onboarding App. All rights reserved.
    `
  }

  generateWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .welcome-message { background: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to Our Platform!</h1>
        </div>
        <div class="content">
          <div class="welcome-message">
            <h2>Hello ${name}!</h2>
            <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
          </div>
          
          <p>You can now enjoy all the features of our platform:</p>
          <ul>
            <li>Access your personalized dashboard</li>
            <li>Update your profile information</li>
            <li>Connect with other users</li>
            <li>And much more!</li>
          </ul>
          
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
          
          <p>Thank you for joining us!</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} User Onboarding App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }

  generateWelcomeEmailText(name) {
    return `
Welcome to Our Platform!

Hello ${name}!

Congratulations! Your email has been successfully verified and your account is now active.

You can now enjoy all the features of our platform:
- Access your personalized dashboard
- Update your profile information
- Connect with other users
- And much more!

If you have any questions or need assistance, feel free to contact our support team.

Thank you for joining us!

This is an automated email. Please do not reply to this message.

© ${new Date().getFullYear()} User Onboarding App. All rights reserved.
    `
  }

  generatePasswordResetEmailTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <div class="warning">
            <p><strong>Security Notice:</strong></p>
            <ul>
              <li>This link will expire in 1 hour for security reasons</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will remain unchanged until you create a new one</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} User Onboarding App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }

  generatePasswordResetEmailText(name, resetUrl) {
    return `
Reset Your Password

Hello ${name}!

We received a request to reset your password. Visit the following link to create a new password:

${resetUrl}

Security Notice:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

This is an automated email. Please do not reply to this message.

© ${new Date().getFullYear()} User Onboarding App. All rights reserved.
    `
  }
}

const emailService = new EmailService()

module.exports = emailService
