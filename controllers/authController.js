const User = require("./models/User")
const asyncHandler = require("../utils/asyncHandler")
const ResponseHandler = require("../utils/response")
const jwtManager = require("../utils/jwt")
const logger = require("../utils/logger")
const emailService = require("../services/emailService")

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  logger.logAuth("REGISTRATION_ATTEMPT", null, email, req.ip, req.get("User-Agent"))

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    logger.logAuth("REGISTRATION_FAILED_DUPLICATE", null, email, req.ip, req.get("User-Agent"))
    return ResponseHandler.conflict(res, "User with this email already exists")
  }

  let profileImageUrl = null
  if (req.file) {
    profileImageUrl = req.file.path
    logger.info("Profile image uploaded successfully", {
      email,
      imageUrl: profileImageUrl,
      fileSize: req.file.size,
    })
  }

  try {
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      profileImage: profileImageUrl,
    })

    const verificationCode = user.generateVerificationCode()

    await user.save()

    logger.logAuth("USER_CREATED", user._id, email, req.ip, req.get("User-Agent"))

    try {
      await emailService.sendVerificationEmail(user.email, user.name, verificationCode)
      logger.info("Verification email sent successfully", {
        userId: user._id,
        email: user.email,
      })
    } catch (emailError) {
      logger.error("Failed to send verification email", {
        userId: user._id,
        email: user.email,
        error: emailError.message,
      })
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    }

    logger.logAuth("REGISTRATION_SUCCESS", user._id, email, req.ip, req.get("User-Agent"))

    return ResponseHandler.created(
      res,
      userData,
      "User registered successfully. Please check your email for verification instructions.",
    )
  } catch (error) {
    logger.error("Registration failed", {
      email,
      error: error.message,
      stack: error.stack,
    })

    if (error.code === 11000) {
      return ResponseHandler.conflict(res, "User with this email already exists")
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }))
      return ResponseHandler.validationError(res, validationErrors)
    }

    return ResponseHandler.error(res, "Registration failed. Please try again.")
  }
})

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    return ResponseHandler.validationError(res, [{ field: "email", message: "Email is required" }])
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })

  if (!user) {
    return ResponseHandler.success(res, null, "If the email exists, a verification email has been sent.")
  }

  if (user.isVerified) {
    return ResponseHandler.error(res, "User is already verified", 400)
  }

  try {
    const verificationCode = user.generateVerificationCode()
    await user.save()

    await emailService.sendVerificationEmail(user.email, user.name, verificationCode)

    logger.logAuth("VERIFICATION_EMAIL_RESENT", user._id, email, req.ip, req.get("User-Agent"))

    return ResponseHandler.success(res, null, "Verification email sent successfully.")
  } catch (error) {
    logger.error("Failed to resend verification email", {
      userId: user._id,
      email,
      error: error.message,
    })

    return ResponseHandler.error(res, "Failed to send verification email. Please try again.")
  }
})

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  logger.logAuth("LOGIN_ATTEMPT", null, email, req.ip, req.get("User-Agent"))

  const user = await User.findByEmail(email.toLowerCase().trim())

  if (!user) {
    logger.logAuth("LOGIN_FAILED_USER_NOT_FOUND", null, email, req.ip, req.get("User-Agent"))
    return ResponseHandler.unauthorized(res, "Invalid email or password")
  }

  if (user.isLocked) {
    logger.logAuth("LOGIN_FAILED_ACCOUNT_LOCKED", user._id, email, req.ip, req.get("User-Agent"))
    return ResponseHandler.error(
      res,
      "Account is temporarily locked due to too many failed login attempts. Please try again later.",
      423,
    )
  }

  if (!user.isVerified) {
    logger.logAuth("LOGIN_FAILED_NOT_VERIFIED", user._id, email, req.ip, req.get("User-Agent"))
    return ResponseHandler.forbidden(res, "Please verify your email address before logging in")
  }

  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    logger.logAuth("LOGIN_FAILED_INVALID_PASSWORD", user._id, email, req.ip, req.get("User-Agent"))

    await user.incLoginAttempts()

    return ResponseHandler.unauthorized(res, "Invalid email or password")
  }

  try {
    await user.resetLoginAttempts()

    const token = jwtManager.generateUserToken(user)

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }

    logger.logAuth("LOGIN_SUCCESS", user._id, email, req.ip, req.get("User-Agent"))

    return ResponseHandler.success(
      res,
      {
        user: userData,
        token,
        tokenType: "Bearer",
      },
      "Login successful",
    )
  } catch (error) {
    logger.error("Login process failed", {
      userId: user._id,
      email,
      error: error.message,
    })

    return ResponseHandler.error(res, "Login failed. Please try again.")
  }
})

const logoutUser = asyncHandler(async (req, res) => {
  logger.logAuth("LOGOUT", req.user._id, req.user.email, req.ip, req.get("User-Agent"))

  return ResponseHandler.success(res, null, "Logged out successfully")
})

module.exports = {
  registerUser,
  resendVerificationEmail,
  loginUser,
  logoutUser,
}
