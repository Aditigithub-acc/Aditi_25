// controllers/verificationController.js
const User = require("../models/user");
const asyncHandler = require("../utils/asyncHandler");
const ResponseHandler = require("../utils/response");
const logger = require("../utils/logger");
const emailService = require("../services/emailService");

// GET /verify/:code
const verifyEmail = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const user = await User.findOne({ verificationCode: code, verificationCodeExpires: { $gt: Date.now() } });
  if (!user) return ResponseHandler.error(res, "Invalid or expired verification code", 400);
  if (user.isVerified) return ResponseHandler.success(res, null, "Email is already verified");

  await user.verifyAccount();

  try { await emailService.sendWelcomeEmail(user.email, user.name); } catch (err) { console.error(err); }

  return ResponseHandler.success(res, { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, isVerified: true }, "Email verified successfully");
});

// POST /verify-code
const verifyEmailWithCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return ResponseHandler.validationError(res, [
    { field: "email", message: "Email required" },
    { field: "code", message: "Code required" },
  ]);

  const user = await User.findOne({ email: email.toLowerCase().trim(), verificationCode: code, verificationCodeExpires: { $gt: Date.now() } });
  if (!user) return ResponseHandler.error(res, "Invalid email or verification code", 400);
  if (user.isVerified) return ResponseHandler.success(res, null, "Email is already verified");

  await user.verifyAccount();
  try {
    const result = await emailService.sendWelcomeEmail(user.email, user.name);
    console.log(result.success ? `Welcome email sent to ${user.email}` : `Email error: ${result.error}`);
  } catch (err) { console.error(err); }

  return ResponseHandler.success(res, { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, isVerified: true }, "Email verified successfully! Welcome email sent.");
});

// GET /status/:email
const checkVerificationStatus = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return ResponseHandler.notFound(res, "User not found");

  return ResponseHandler.success(res, {
    email: user.email,
    isVerified: user.isVerified,
    hasVerificationCode: !!user.verificationCode,
    verificationCodeExpired: user.verificationCodeExpires ? user.verificationCodeExpires < Date.now() : true,
  }, "Verification status retrieved");
});

module.exports = { verifyEmail, verifyEmailWithCode, checkVerificationStatus };
