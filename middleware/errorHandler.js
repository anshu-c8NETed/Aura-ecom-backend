'use strict';

const ApiError = require('../utils/ApiError');

const handleCastError = (err) =>
  new ApiError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateField = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new ApiError(`Duplicate value for field "${field}". Please use a different value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map(e => e.message);
  return new ApiError(`Validation failed: ${messages.join('. ')}`, 422);
};

const handleJWTError    = () => new ApiError('Invalid token. Please log in again.', 401);
const handleJWTExpired  = () => new ApiError('Token expired. Please log in again.', 401);

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === 'CastError')               error = handleCastError(err);
  if (err.code === 11000)                     error = handleDuplicateField(err);
  if (err.name === 'ValidationError')         error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError')       error = handleJWTError();
  if (err.name === 'TokenExpiredError')       error = handleJWTExpired();

  const statusCode = error.statusCode || 500;
  const status     = error.status     || 'error';

  res.status(statusCode).json({
    success: false,
    status,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};