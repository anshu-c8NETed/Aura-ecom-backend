'use strict';

const { NODE_ENV } = require('../config/env');

const COOKIE_OPTS_ACCESS = {
  httpOnly: true,
  secure:   NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   15 * 60 * 1000,         // 15 min
};

const COOKIE_OPTS_REFRESH = {
  httpOnly: true,
  secure:   NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

exports.sendTokens = (user, res, statusCode = 200, message = 'Success') => {
  const accessToken  = user.signAccessToken();
  const refreshToken = user.signRefreshToken();

  res.cookie('accessToken',  accessToken,  COOKIE_OPTS_ACCESS);
  res.cookie('refreshToken', refreshToken, COOKIE_OPTS_REFRESH);

  // Strip sensitive fields
  user.password      = undefined;
  user.refreshTokens = undefined;

  res.status(statusCode).json({
    success:      true,
    message,
    accessToken,  // also send in body for clients that prefer headers
    data: { user },
  });
};

exports.clearTokens = (res) => {
  res.cookie('accessToken',  '', { maxAge: 0 });
  res.cookie('refreshToken', '', { maxAge: 0 });
};