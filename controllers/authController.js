const User = require("../models/user.js");
const asyncHandler = require("../utils/asyncHandler");
const ResponseHandler = require("../utils/response");
const logger = require("../utils/logger");
const emailService = require("../services/emailService");
const jwtManager = require("../utils/jwt");

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  logger.logAuth("REGISTRATION_ATTEMPT", null, email, req.ip, req.get("User-Agent"));

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) return ResponseHandler.conflict(res, "User with this email already exists");

  const profileImageUrl = req.file ? req.file.path : null;
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  const user = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    profileImage: profileImageUrl,
    verificationCode,
    isVerified: false,
  });

  await user.save();

  try {
    // call via emailService
    await emailService.sendVerificationEmail(user.email, user.name, verificationCode);
  } catch (err) {
    console.error("Verification email error:", err); // log whole error

    // optional rollback: remove the created user to avoid orphaned records
    try {
      await User.deleteOne({ _id: user._id });
      console.log("Rolled back user creation due to email failure");
    } catch (delErr) {
      console.error("Failed to rollback user after email error:", delErr);
    }

    return ResponseHandler.error(res, "Failed to send verification email. Please try again.");
  }

  logger.logAuth("REGISTRATION_SUCCESS", user._id, email, req.ip, req.get("User-Agent"));

  return ResponseHandler.created(
    res,
    {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    "User registered successfully. Check your email for verification code."
  );
});


// RESEND VERIFICATION EMAIL
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return ResponseHandler.validationError(res, [{ field: "email", message: "Email is required" }]);

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return ResponseHandler.success(res, null, "If the email exists, verification email sent");

  if (user.isVerified) return ResponseHandler.error(res, "User already verified", 400);

  const verificationCode = user.generateVerificationCode();
  await user.save();
  await emailService.sendVerificationEmail(user.email, user.name, verificationCode);

  logger.logAuth("VERIFICATION_EMAIL_RESENT", user._id, email, req.ip, req.get("User-Agent"));

  return ResponseHandler.success(res, null, "Verification email resent successfully");
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email.toLowerCase().trim());
  if (!user) return ResponseHandler.unauthorized(res, "Invalid email or password");
  if (!user.isVerified) return ResponseHandler.forbidden(res, "Please verify email before login");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incLoginAttempts();
    return ResponseHandler.unauthorized(res, "Invalid email or password");
  }

  await user.resetLoginAttempts();

  const token = jwtManager.generateUserToken(user);

  return ResponseHandler.success(res, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
    },
    token,
    tokenType: "Bearer",
  }, "Login successful");
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  return ResponseHandler.success(res, null, "Logged out successfully");
});

module.exports = {
  registerUser,
  resendVerificationEmail,
  loginUser,
  logoutUser,
};
