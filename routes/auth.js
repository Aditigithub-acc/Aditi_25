const express = require("express")
const validators = require("../utils/Validators")
const { upload } = require("../config/cloudinary")
const User = require('../models/user.js')
const { validateRegistration, validateLogin, validateVerificationCode, validateProfileImage, validatePasswordResetRequest, validatePasswordReset, validatePasswordChange, } = require("../utils/Validators.js")
const { protect } = require("../middleware/auth.js")

const { registerUser, resendVerificationEmail, loginUser, logoutUser } = require("../controllers/authController")

const { getUserProfile, updateUserProfile } = require("../controllers/profileController")

const { forgotPassword, resetPassword, changePassword } = require("../controllers/passwordController")

const { refreshToken } = require("../controllers/tokenController")

const { verifyEmail } = require("../controllers/verificationController")

const router = express.Router()

router.post("/register", upload.single("profileImage"), validateRegistration, registerUser)
router.post("/resend-verification", resendVerificationEmail)
router.get("/verify/:code", validateVerificationCode, verifyEmail)
router.post("/login", validateLogin, loginUser)
router.post("/forgot-password", validatePasswordResetRequest, forgotPassword)
router.post("/reset-password", validatePasswordReset, resetPassword)
router.post("/refresh-token", refreshToken)
router.post("/logout", protect, logoutUser)

router.get("/profile", protect, getUserProfile)
router.put("/profile", protect, upload.single("profileImage"), updateUserProfile)
router.put("/change-password", protect, validatePasswordChange, changePassword)

module.exports = router
