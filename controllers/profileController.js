const User = require("../models/user")
const asyncHandler = require("../utils/asyncHandler")
const ResponseHandler = require("../utils/response")
const logger = require("../utils/logger")

const getUserProfile = asyncHandler(async (req, res) => {
  const user = req.user

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }

  return ResponseHandler.success(res, userData, "Profile retrieved successfully")
})

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name } = req.body
  const user = req.user
  try {
    if (name && name.trim()) {
      user.name = name.trim()
    }
    if (req.file) {
      user.profileImage = req.file.path
      logger.info("Profile image updated", {
        userId: user._id,
        newImageUrl: user.profileImage,
      })
    }

    await user.save()

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      updatedAt: user.updatedAt,
    }

    logger.info("Profile updated successfully", {
      userId: user._id,
      email: user.email,
    })

    return ResponseHandler.success(res, userData, "Profile updated successfully")
  } catch (error) {
    logger.error("Profile update failed", {
      userId: user._id,
      error: error.message,
    })

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      }))
      return ResponseHandler.validationError(res, validationErrors)
    }

    return ResponseHandler.error(res, "Profile update failed. Please try again.")
  }
})

module.exports = {
  getUserProfile,
  updateUserProfile,
}