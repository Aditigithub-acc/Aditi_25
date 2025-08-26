const express = require("express")
const { validateVerificationCode } = require("../utils/Validators.js")
const { verifyEmail, checkVerificationStatus, verifyEmailWithCode } = require("../controllers/verificationController.js")

const router = express.Router()

router.get("/verify/:code", validateVerificationCode, verifyEmail)
router.get("/status/:email", checkVerificationStatus)
router.post("/verify-code", verifyEmailWithCode)

module.exports = router