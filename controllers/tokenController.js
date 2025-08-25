const User = require("./models/user")
const asyncHandler = require("../utils/asyncHandler")
const ResponseHandler = require("../utils/response")
const jwtManager = require("../utils/jwt")
const logger = require("../utils/logger")

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body

  if (!token) {
    return ResponseHandler.unauthorized(res, "Refresh token is required")
  }

  try {
    const decoded = jwtManager.verifyToken(token)

    const user = await User.findById(decoded.id)

    if (!user || !user.isVerified) {
      return ResponseHandler.unauthorized(res, "Invalid refresh token")
    }

    const newToken = jwtManager.generateUserToken(user)

    logger.logAuth("TOKEN_REFRESHED", user._id, user.email, req.ip, req.get("User-Agent"))

    return ResponseHandler.success(
      res,
      {
        token: newToken,
        tokenType: "Bearer",
      },
      "Token refreshed successfully",
    )
  } catch (error) {
    logger.error("Token refresh failed", {
      error: error.message,
    })

    return ResponseHandler.unauthorized(res, "Invalid or expired refresh token")
  }
})

module.exports = {
  refreshToken,
}
