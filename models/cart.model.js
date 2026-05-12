'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name:      { type: String, required: true },
  image:     { type: String },
  size:      { type: String },
  color:     { type: String },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1, default: 1 },
}, { _id: true });

cartItemSchema.virtual('subtotal').get(function () {
  return parseFloat((this.price * this.quantity).toFixed(2));
});

const cartSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sessionId: { type: String, default: null },    // for guest carts
  items:     { type: [cartItemSchema], default: [] },
  coupon:    { type: String, default: '' },
  discount:  { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-expire guest carts after 30 days
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, i) => sum + i.quantity, 0);
});

cartSchema.virtual('subtotal').get(function () {
  return parseFloat(
    this.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)
  );
});

cartSchema.virtual('total').get(function () {
  return parseFloat((this.subtotal - this.discount).toFixed(2));
});

module.exports = mongoose.model('Cart', cartSchema);