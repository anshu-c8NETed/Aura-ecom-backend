'use strict';

const { JWT_ACCESS_EXPIRE, JWT_REFRESH_EXPIRE } = require('../config/env');

/**
 * Sign tokens, set httpOnly cookies, and send JSON response.
 * No dependency on `next` — purely res-based.
 */
const sendTokens = (user, res, statusCode, message) => {
  const accessToken  = user.signAccessToken();
  const refreshToken = user.signRefreshToken();

  const isProduction = process.env.NODE_ENV === 'production';

  // Access token cookie — short-lived
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge:   15 * 60 * 1000,           // 15 minutes
  });

  // Refresh token cookie — long-lived
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/api/auth/refresh-token',
  });

  // Strip sensitive fields from user object
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.refreshTokens;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;
  delete userObj.emailVerifyToken;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user:        userObj,
      accessToken,            // also send in body for non-cookie clients
    },
  });
};

const clearTokens = (res) => {
  res.clearCookie('accessToken',  { httpOnly: true, path: '/' });
  res.clearCookie('refreshToken', { httpOnly: true, path: '/api/auth/refresh-token' });
};

module.exports = { sendTokens, clearTokens };