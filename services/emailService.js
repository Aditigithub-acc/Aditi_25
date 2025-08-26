const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number.parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.verifyConnection();
    } catch (error) {
      logger.error("Failed to initialize email transporter", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info("Email service connected successfully");
    } catch (error) {
      logger.error("Email service connection failed", {
        error: error.message,
      });
    }
  }

  async sendMail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: {
          name: "User Onboarding App",
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        },
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info("📧 Email sent successfully", {
        to,
        subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error("Failed to send email", {
        to,
        subject,
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new EmailService();
