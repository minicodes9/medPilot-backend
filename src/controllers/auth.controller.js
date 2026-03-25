const User = require('../models/user.model');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');

// ── REGISTER ────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
    });

    return successResponse(res, 'Registration successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: generateAccessToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    }, 201);
  } catch (error) {
    next(error);
  }
};

// ── LOGIN ────────────────────────────────────────────────
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

// ── GET PROFILE ──────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, 'Profile retrieved', user);
  } catch (error) {
    next(error);
  }
};

// ── UPDATE PROFILE ───────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return errorResponse(res, 'Email already in use', 409);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
      },
      { new: true, runValidators: true }
    ).lean();

    return successResponse(res, 'Profile updated', updatedUser);
  } catch (error) {
    next(error);
  }
};

// ── CHANGE PASSWORD ──────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

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

// ── FORGOT PASSWORD ──────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return successResponse(res, 'If that email exists you will receive a reset link');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'MedPilot Password Reset',
      text: `Reset your password: ${resetUrl}`,
      html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    return successResponse(res, 'If that email exists you will receive a reset link');
  } catch (error) {
    next(error);
  }
};

// ── RESET PASSWORD ───────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(res, 'Token and new password are required', 400);
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired token', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return successResponse(res, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};