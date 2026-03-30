const User = require('../models/user.model');
const Medication = require('../models/medications.model');
const DoseLog = require('../models/doseLog.model');
const RefillRequest = require('../models/refillRequest.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');
const { sendOTP } = require('../services/email.service');

// REGISTER 
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      role,
      isVerified: false,
    });

    const otp = user.generateOTP();
    await user.save();

    await sendOTP({ to: user.email, name: user.name, otp });

    return successResponse(
      res,
      'Registration successful! Please verify your email with the OTP sent.',
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ── VERIFY OTP ────────────────────────────────────────────
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 'Email and OTP are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse(res, 'Invalid or expired OTP', 400);
    }

    try {
      user.verifyOTP(otp.toString().trim());
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }

    await user.save();

    return successResponse(res, 'Account verified successfully');
  } catch (error) {
    next(error);
  }
};

// ── RESEND OTP ────────────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return successResponse(res, 'If that email exists a new OTP will be sent');
    }

    if (user.isVerified) {
      return errorResponse(res, 'Account is already verified', 400);
    }

    const oneMinuteAgo = Date.now() - 60 * 1000;
    if (user.otpExpires && user.otpExpires.getTime() - 14 * 60 * 1000 > oneMinuteAgo) {
      return errorResponse(res, 'Please wait a minute before requesting a new OTP', 429);
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOTP({ to: user.email, name: user.name, otp });

    return successResponse(res, 'A new OTP has been sent to your email');
  } catch (error) {
    next(error);
  }
};

// ── LOGIN ─────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 403);
    }

    if (!user.isVerified) {
      return errorResponse(res, 'Please verify your account first', 403);
    }

    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    return successResponse(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: generateAccessToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// ── GET PROFILE ───────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, 'Profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (existingUser) return errorResponse(res, 'Email already in use', 409);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
      },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    return successResponse(res, 'Profile updated', updatedUser);
  } catch (error) {
    next(error);
  }
};

// ── CHANGE PASSWORD ───────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return errorResponse(res, 'User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 'Current password is incorrect', 400);

    if (currentPassword === newPassword) {
      return errorResponse(res, 'New password must be different', 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// ── FORGOT PASSWORD ───────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase();
    if (!email) return errorResponse(res, 'Email is required', 400);

    const user = await User.findOne({ email });
    if (!user) {
      return successResponse(res, 'If that email exists you will receive a reset code');
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOTP({ to: user.email, name: user.name, otp });

    return successResponse(res, 'If that email exists you will receive a reset code');
  } catch (error) {
    next(error);
  }
};

// ── RESET PASSWORD ────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return errorResponse(res, 'Token and new password are required', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return errorResponse(res, 'Token is invalid or has expired', 400);

    user.password = newPassword;
    user.isVerified = true;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return successResponse(res, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// ── DELETE ACCOUNT ────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return errorResponse(res, 'User not found', 404);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse(res, 'Incorrect password', 401);

    await Promise.all([
      DoseLog.deleteMany({ user: req.user._id }),
      Medication.deleteMany({ user: req.user._id }),
      RefillRequest.deleteMany({ user: req.user._id }),
      User.findByIdAndDelete(req.user._id),
    ]);

    return successResponse(res, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
};