'use strict';

const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  let error = err;

  // Wrap non-ApiError errors
  if (!(error instanceof ApiError)) {
    const status  = error.statusCode || error.status || 500;
    const message = error.message    || 'Something went wrong';
    error = new ApiError(message, status);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join('. ');
    error = new ApiError(messages, 400);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  error = new ApiError('Invalid token.',         401);
  if (err.name === 'TokenExpiredError')  error = new ApiError('Token expired.',          401);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};