'use strict';

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  rating: {
    type:     Number,
    required: [true, 'Rating is required'],
    min:      1,
    max:      5,
  },
  title:   { type: String, required: [true, 'Review title is required'], maxlength: 100 },
  body:    { type: String, required: [true, 'Review body is required'], maxlength: 2000 },
  images:  [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes:  { type: Number, default: 0 },
  reportedCount: { type: Number, default: 0 },
  isPublished:   { type: Boolean, default: true },
}, {
  timestamps: true,
});

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// ─── Static: recalculate product ratings ──────────────────
reviewSchema.statics.recalcProductRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId, isPublished: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const Product = require('./product.model');
  if (stats.length) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: stats[0].avg,
      ratingsCount:   stats[0].count,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { ratingsAverage: 0, ratingsCount: 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.recalcProductRatings(this.product);
});
reviewSchema.post('remove', function () {
  this.constructor.recalcProductRatings(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);