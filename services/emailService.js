// const nodemailer = require("nodemailer");
// const logger = require("../utils/logger");

// class EmailService {
//   constructor() {
//     this.transporter = null;
//     this.initializeTransporter();
//   }

//   initializeTransporter() {
//     try {
//       this.transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST || "smtp.gmail.com",
//         port: Number.parseInt(process.env.EMAIL_PORT, 10) || 587,
//         secure: false, // true for 465, false for other ports
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//         tls: {
//           rejectUnauthorized: false,
//         },
//       });

//       this.verifyConnection();
//     } catch (error) {
//       logger.error("Failed to initialize email transporter", {
//         error: error.message,
//         stack: error.stack,
//       });
//     }
//   }

//   async verifyConnection() {
//     try {
//       await this.transporter.verify();
//       logger.info("Email service connected successfully");
//     } catch (error) {
//       logger.error("Email service connection failed", {
//         error: error.message,
//       });
//     }
//   }

// async sendWelcomeEmail(to, name) {
//   const subject = "Welcome to User Onboarding App!";
//   const html = `
//     <h2>Hi ${name},</h2>
//     <p>Your email has been successfully verified. Welcome aboard!</p>
//     <p>Thanks,<br/>User Onboarding App Team</p>
//   `;
//   const text = `Hi ${name},\nYour email has been successfully verified. Welcome aboard!\n\nThanks,\nUser Onboarding App Team`;

//   return this.sendMail(to, subject, html, text);
// }

// }

// module.exports = new EmailService();


// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email server connection error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

const sendVerificationEmail = async (email, name, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Email Verification",
    html: `
      <h3>Hello ${name},</h3>
      <p>Thank you for registering. Please verify your email using the following code:</p>
      <h2>${code}</h2>
      <p>Or click <a href="http://localhost:3000/verify/${code}">here</a> to verify directly</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("📩 Verification email sent:", info.messageId);
  return info;
};

module.exports = { sendVerificationEmail }; // <-- this is correct for CommonJS

