const router = require('express').Router();
const validateRequest = require('../middlewares/validateRequest');
const { protect } = require('../middlewares/auth.middleware');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOTP,
  resendOTP, // ← added
  resetPassword,
  deleteAccount,
} = require('../controllers/auth.controller');

const { registerSchema, loginSchema } = require('../validations/auth.validation');

// ── PUBLIC ROUTES ─────────────────────────────
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/reset-password', resetPassword);

// ── PROTECTED ROUTES ──────────────────────────
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;