const express = require("express");
const { upload } = require("../config/cloudinary");
const { protect } = require("../middleware/auth");
const { validateRegistration, validateLogin, validateVerificationCode, validateProfileImage,
     validatePasswordResetRequest, validatePasswordReset, validatePasswordChange, } = require("../utils/Validators");

const { registerUser, resendVerificationEmail, loginUser, logoutUser, } = require("../controllers/authController");

const { getUserProfile, updateUserProfile } = require("../controllers/profileController");
const { forgotPassword, resetPassword, changePassword } = require("../controllers/passwordController");
const { refreshToken } = require("../controllers/tokenController");
const { verifyEmail } = require("../controllers/verificationController");

const router = express.Router();

// ----------------- AUTH ROUTES -----------------

// Register with profile image
router.post(
  "/register",
  (req, res, next) => {
    const uploadSingle = upload.single("profileImage"); // must match frontend key
    uploadSingle(req, res, function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({
          success: false,
          message: "File upload failed",
          error: err.message,
        });
      }
      next();
    });
  },
  validateRegistration,
  registerUser
);

// Resend verification email
router.post("/resend-verification", resendVerificationEmail);

// Verify email via code
router.get("/verify/:code", validateVerificationCode, verifyEmail);

// Login
router.post("/login", validateLogin, loginUser);

// Forgot password
router.post("/forgot-password", validatePasswordResetRequest, forgotPassword);

// Reset password
router.post("/reset-password", validatePasswordReset, resetPassword);

// Change password (authenticated)
router.put("/change-password", protect, validatePasswordChange, changePassword);

// Refresh token
router.post("/refresh-token", refreshToken);

// Logout (authenticated)
router.post("/logout", protect, logoutUser);

// ----------------- PROFILE ROUTES -----------------

// Get user profile (authenticated)
router.get("/profile", protect, getUserProfile);

// Update profile (authenticated + optional image)
router.put(
  "/profile",
  protect,
  (req, res, next) => {
    const uploadSingle = upload.single("profileImage");
    uploadSingle(req, res, function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({
          success: false,
          message: "File upload failed",
          error: err.message,
        });
      }
      next();
    });
  },
  updateUserProfile
);

module.exports = router;
