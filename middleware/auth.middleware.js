'use strict';

const jwt      = require('jsonwebtoken');
const User     = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { JWT_ACCESS_SECRET } = require('../config/env');

// ── Verify JWT and attach user to req ─────────────────────
exports.protect = async (req, _res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError('Not authenticated. Please log in.', 401));
    }

    // jwt.verify throws synchronously — must be inside try/catch
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (jwtErr) {
      return next(new ApiError('Invalid or expired token. Please log in again.', 401));
    }

    const user = await User.findById(decoded.id).select('+isActive');

    if (!user)          return next(new ApiError('User no longer exists.', 401));
    if (!user.isActive) return next(new ApiError('Your account has been deactivated.', 403));

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ── Restrict to specific roles ────────────────────────────
exports.restrict = (...roles) => (req, _res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError('Not authenticated.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You do not have permission to perform this action.', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
};