'use strict';

const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const User     = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { sendTokens, clearTokens } = require('../utils/tokens');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
const { JWT_REFRESH_SECRET, CLIENT_URL } = require('../config/env');

// ─── Register ─────────────────────────────────────────────
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError('An account with this email already exists.', 409);

  const user  = await User.create({ firstName, lastName, email, password });
  const token = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  await sendWelcomeEmail(user, verifyUrl).catch(() => {});

  sendTokens(user, res, 201, 'Registration successful. Please check your email to verify your account.');
};

// ─── Login ────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError('Email and password are required.', 400);

  const user = await User.findOne({ email }).select('+password +refreshTokens +isActive');
  if (!user || !(await user.comparePassword(password)))
    throw new ApiError('Invalid email or password.', 401);

  if (!user.isActive) throw new ApiError('Your account has been deactivated. Please contact support.', 403);

  const refresh = user.signRefreshToken();
  user.refreshTokens.push(refresh);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokens(user, res, 200, 'Login successful.');
};

// ─── Refresh token ────────────────────────────────────────
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ApiError('No refresh token provided.', 401);

  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  const user    = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token))
    throw new ApiError('Invalid or expired refresh token.', 401);

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter(t => t !== token);
  const newRefresh   = user.signRefreshToken();
  user.refreshTokens.push(newRefresh);
  await user.save({ validateBeforeSave: false });

  sendTokens(user, res, 200, 'Token refreshed.');
};

// ─── Logout ───────────────────────────────────────────────
exports.logout = async (req, res) => {
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
};

// ─── Verify email ─────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user   = await User.findOne({ emailVerifyToken: hashed });
  if (!user) throw new ApiError('Invalid or expired verification link.', 400);

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully.' });
};

// ─── Forgot password ──────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Always respond with 200 to prevent email enumeration
  if (user) {
    const raw      = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${CLIENT_URL}/reset-password?token=${raw}`;
    await sendPasswordResetEmail(user, resetUrl).catch(() => {});
  }
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
};

// ─── Reset password ───────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user   = await User.findOne({
    passwordResetToken:   hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+refreshTokens');

  if (!user) throw new ApiError('Invalid or expired reset token.', 400);
  if (!req.body.password) throw new ApiError('New password is required.', 400);

  user.password             = req.body.password;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens        = [];           // invalidate all sessions
  await user.save();

  sendTokens(user, res, 200, 'Password reset successful.');
};

// ─── Get me ───────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};