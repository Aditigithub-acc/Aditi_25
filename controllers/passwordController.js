const User = require("./models/user")
const asyncHandler = require("../utils/asyncHandler")
const ResponseHandler = require("../utils/response")
const logger = require("../utils/logger")
const emailService = require("../services/emailService")
const crypto = require("crypto")
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  logger.logAuth("PASSWORD_RESET_REQUEST", null, email, req.ip, req.get("User-Agent"))
   try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
     if (!user) {
      return ResponseHandler.success(res, null, "If the email exists, a password reset link has been sent.")
    }
    const resetToken = crypto.randomBytes(32).toString("hex")

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000

    await user.save({ validateBeforeSave: false })

    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken)

    logger.logAuth("PASSWORD_RESET_EMAIL_SENT", user._id, email, req.ip, req.get("User-Agent"))

    return ResponseHandler.success(res, null, "Password reset email sent successfully.")
  } catch (error) {
    logger.error("Password reset request failed", {
      email,
      error: error.message,
    })
     return ResponseHandler.error(res, "Failed to process password reset request.")
  }
})

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  logger.logAuth("PASSWORD_RESET_ATTEMPT", null, null, req.ip, req.get("User-Agent"))

  try {
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      logger.logAuth("PASSWORD_RESET_FAILED_INVALID_TOKEN", null, null, req.ip, req.get("User-Agent"))
      return ResponseHandler.error(res, "Invalid or expired reset token", 400)
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    logger.logAuth("PASSWORD_RESET_SUCCESS", user._id, user.email, req.ip, req.get("User-Agent"))

    return ResponseHandler.success(res, null, "Password reset successful. You can now login with your new password.")
  } catch (error) {
    logger.error("Password reset failed", {
      error: error.message,
    })

    return ResponseHandler.error(res, "Password reset failed. Please try again.")
  }
})

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select("+password")

  const isCurrentPasswordValid = await user.comparePassword(currentPassword)

  if (!isCurrentPasswordValid) {
    logger.logAuth("PASSWORD_CHANGE_FAILED_INVALID_CURRENT", user._id, user.email, req.ip, req.get("User-Agent"))
    return ResponseHandler.unauthorized(res, "Current password is incorrect")
  }

  user.password = newPassword
  await user.save()

  logger.logAuth("PASSWORD_CHANGE_SUCCESS", user._id, user.email, req.ip, req.get("User-Agent"))

  return ResponseHandler.success(res, null, "Password changed successfully")
})
module.exports = {
  forgotPassword,
  resetPassword,
  changePassword,
}
