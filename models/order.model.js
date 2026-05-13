'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId },
  name:      { type: String, required: true },
  brand:     { type: String },
  image:     { type: String },
  size:      { type: String },
  color:     { type: String },
  sku:       { type: String },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  subtotal:  { type: Number, required: true },
}, { _id: true });

const addressSnapshotSchema = new mongoose.Schema({
  firstName:  String,
  lastName:   String,
  line1:      String,
  line2:      String,
  city:       String,
  state:      String,
  postalCode: String,
  country:    String,
  phone:      String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  items:           { type: [orderItemSchema], required: true },
  shippingAddress: { type: addressSnapshotSchema, required: true },
  billingAddress:  { type: addressSnapshotSchema },

  subtotal:     { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  taxAmount:    { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },
  total:        { type: Number, required: true },
  currency:     { type: String, default: 'INR' },
  couponCode:   { type: String, default: '' },

  status: {
    type:    String,
    enum:    ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  statusHistory: [{
    status:    String,
    message:   String,
    timestamp: { type: Date, default: Date.now },
    _id:       false,
  }],

  paymentMethod:     { type: String, default: 'cod' },
  paymentStatus:     { type: String, enum: ['unpaid', 'paid', 'refunded', 'partially_refunded'], default: 'unpaid' },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  paidAt:            { type: Date },

  carrier:           { type: String, default: '' },
  trackingNumber:    { type: String, default: '' },
  estimatedDelivery: { type: Date },
  shippedAt:         { type: Date },
  deliveredAt:       { type: Date },

  customerNote: { type: String, default: '' },
  internalNote: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ razorpayOrderId: 1 });

// ─── Auto-generate order number ───────────────────────────
// Mongoose 9: async hooks must NOT use next() callback
orderSchema.pre('save', async function () {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `AUR-${String(count + 1000).padStart(6, '0')}`;
    this.statusHistory.push({ status: this.status, message: 'Order created.' });
  }
});

module.exports = mongoose.model('Order', orderSchema);