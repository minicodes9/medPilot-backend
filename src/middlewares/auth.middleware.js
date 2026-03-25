const User = require('../models/user.model');
const { verifyAccessToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader) {
      const error = new Error('No authorization header provided');
      error.statusCode = 401;
      return next(error);
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      const error = new Error('Invalid token format');
      error.statusCode = 401;
      return next(error);
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token using utility
    const decoded = verifyAccessToken(token);

    // Attach userId to request for downstream use
    req.userId = decoded.userId;

    // Fetch user (exclude password)
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

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    const error = new Error('Access denied. Admins only');
    error.statusCode = 403;
    return next(error);
  }
  next();
};

module.exports = { protect, adminOnly };