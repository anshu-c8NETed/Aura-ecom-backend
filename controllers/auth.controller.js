'use strict';

const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const User     = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { sendTokens, clearTokens } = require('../utils/tokens');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
const { JWT_REFRESH_SECRET, CLIENT_URL } = require('../config/env');

// ─── Register ─────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return next(new ApiError('An account with this email already exists.', 409));

    const user  = await User.create({ firstName, lastName, email, password });
    const token = user.createEmailVerifyToken();
    await user.save({ validateBeforeSave: false });

    // Send welcome email — don't fail registration if email fails
    try {
      const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
      await sendWelcomeEmail(user, verifyUrl);
    } catch (_) {}

    sendTokens(user, res, 201, 'Registration successful.');
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new ApiError('Email and password are required.', 400));

    const user = await User.findOne({ email }).select('+password +refreshTokens +isActive');
    if (!user || !(await user.comparePassword(password)))
      return next(new ApiError('Invalid email or password.', 401));

    if (!user.isActive)
      return next(new ApiError('Your account has been deactivated.', 403));

    const refresh = user.signRefreshToken();
    user.refreshTokens.push(refresh);
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokens(user, res, 200, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

// ─── Refresh token ────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return next(new ApiError('No refresh token provided.', 401));

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (_) {
      return next(new ApiError('Invalid or expired refresh token.', 401));
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token))
      return next(new ApiError('Invalid or expired refresh token.', 401));

    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    const newRefresh   = user.signRefreshToken();
    user.refreshTokens.push(newRefresh);
    await user.save({ validateBeforeSave: false });

    sendTokens(user, res, 200, 'Token refreshed.');
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token && req.user) {
      const user = await User.findById(req.user._id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        await user.save({ validateBeforeSave: false });
      }
    }
    clearTokens(res);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Verify email ─────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({ emailVerifyToken: hashed });
    if (!user) return next(new ApiError('Invalid or expired verification link.', 400));

    user.isEmailVerified  = true;
    user.emailVerifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Forgot password ──────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const raw      = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
      try {
        const resetUrl = `${CLIENT_URL}/reset-password?token=${raw}`;
        await sendPasswordResetEmail(user, resetUrl);
      } catch (_) {}
    }
    // Always 200 to prevent email enumeration
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// ─── Reset password ───────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user   = await User.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+refreshTokens');

    if (!user) return next(new ApiError('Invalid or expired reset token.', 400));
    if (!req.body.password) return next(new ApiError('New password is required.', 400));

    user.password             = req.body.password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens        = [];
    await user.save();

    sendTokens(user, res, 200, 'Password reset successful.');
  } catch (err) {
    next(err);
  }
};

// ─── Get me ───────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};