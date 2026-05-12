'use strict';

const required = (key) => {
  const val = process.env[key];
  if (!val && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return val;
};

module.exports = {
  NODE_ENV:              process.env.NODE_ENV || 'development',
  PORT:                  parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL:            process.env.CLIENT_URL || 'http://localhost:3000',
  MONGO_URI:             required('MONGO_URI') || 'mongodb://localhost:27017/aura',
  JWT_ACCESS_SECRET:     required('JWT_ACCESS_SECRET') || 'aura_access_dev_secret',
  JWT_REFRESH_SECRET:    required('JWT_REFRESH_SECRET') || 'aura_refresh_dev_secret',
  JWT_ACCESS_EXPIRE:     process.env.JWT_ACCESS_EXPIRE || '15m',
  JWT_REFRESH_EXPIRE:    process.env.JWT_REFRESH_EXPIRE || '7d',
  STRIPE_SECRET_KEY:     process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SMTP_HOST:             process.env.SMTP_HOST || '',
  SMTP_PORT:             parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER:             process.env.SMTP_USER || '',
  SMTP_PASS:             process.env.SMTP_PASS || '',
  EMAIL_FROM:            process.env.EMAIL_FROM || 'no-reply@aura.com',
  EMAIL_FROM_NAME:       process.env.EMAIL_FROM_NAME || 'Aura',
};