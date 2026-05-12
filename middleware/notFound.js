'use strict';

const ApiError = require('../utils/ApiError');

module.exports = (req, _res, next) => {
  next(new ApiError(`Route ${req.originalUrl} not found`, 404));
};