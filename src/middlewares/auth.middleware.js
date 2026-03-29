const User = require('../models/user.model');
const { verifyAccessToken } = require('../utils/jwt');

// ── PROTECT ───────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const error = new Error('No authorization header provided');
      error.statusCode = 401;
      return next(error);
    }

    if (!authHeader.startsWith('Bearer ')) {
      const error = new Error('Invalid token format');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.userId = decoded.userId;

    req.user = await User.findById(decoded.userId)
      .select('-password')
      .lean();

    if (!req.user) {
      const error = new Error('User no longer exists');
      error.statusCode = 401;
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ── ADMIN ONLY ────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const error = new Error('Access denied. Admins only');
    error.statusCode = 403;
    return next(error);
  }
  next();
};

// ── PATIENT ONLY ──────────────────────────────────────────
const patientOnly = (req, res, next) => {
  if (!req.user || req.user.role === 'admin') {
    const error = new Error('Access denied. Patients only');
    error.statusCode = 403;
    return next(error);
  }
  next();
};

// ── PATIENT OR CAREGIVER ──────────────────────────────────
const patientOrCaregiver = (req, res, next) => {
  if (!req.user || req.user.role === 'admin') {
    const error = new Error('Access denied. Patients and caregivers only');
    error.statusCode = 403;
    return next(error);
  }
  next();
};

module.exports = { protect, adminOnly, patientOnly, patientOrCaregiver };