'use strict';

const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRE, JWT_REFRESH_EXPIRE } = require('../config/env');

const addressSchema = new mongoose.Schema({
  label:      { type: String, default: 'Home' },
  firstName:  { type: String, required: true },
  lastName:   { type: String, required: true },
  line1:      { type: String, required: true },
  line2:      { type: String },
  city:       { type: String, required: true },
  state:      { type: String },
  postalCode: { type: String, required: true },
  country:    { type: String, required: true, default: 'FR' },
  phone:      { type: String },
  isDefault:  { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: [true, 'First name is required'], trim: true },
  lastName:   { type: String, required: [true, 'Last name is required'], trim: true },
  email: {
    type:     String,
    required: [true, 'Email is required'],
    unique:   true,
    lowercase: true,
    match:    [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type:     String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select:   false,
  },
  role:            { type: String, enum: ['customer', 'admin'], default: 'customer' },
  avatar:          { type: String, default: '' },
  phone:           { type: String, default: '' },
  addresses:       [addressSchema],
  isEmailVerified: { type: Boolean, default: false },
  isActive:        { type: Boolean, default: true },
  refreshTokens:   [{ type: String, select: false }],

  // Password reset
  passwordResetToken:   { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  // Email verification
  emailVerifyToken:     { type: String, select: false },

  // Stripe customer ID
  stripeCustomerId: { type: String, default: '' },

  lastLoginAt: { type: Date },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

// ─── Virtuals ────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Pre-save: hash password ──────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ─────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.signAccessToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRE,
  });
};

userSchema.methods.signRefreshToken = function () {
  return jwt.sign({ id: this._id }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
  });
};

userSchema.methods.createPasswordResetToken = function () {
  const raw   = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken   = crypto.createHash('sha256').update(raw).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hr
  return raw;
};

userSchema.methods.createEmailVerifyToken = function () {
  const raw   = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(raw).digest('hex');
  return raw;
};

module.exports = mongoose.model('User', userSchema);