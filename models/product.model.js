'use strict';

const mongoose = require('mongoose');
const slugify  = require('slugify');

// ─── Sub-schemas ─────────────────────────────────────────
const imageSchema = new mongoose.Schema({
  url:      { type: String, required: true },
  publicId: { type: String },
  alt:      { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
}, { _id: false });

const variantSchema = new mongoose.Schema({
  size:      { type: String, required: true },
  color:     { type: String, required: true },
  colorHex:  { type: String, default: '#000000' },
  sku:       { type: String, required: true, unique: true },
  stock:     { type: Number, required: true, min: 0, default: 0 },
  price:     { type: Number },
}, { _id: true });

const dimensionsSchema = new mongoose.Schema({
  weight:    { type: Number },
  height:    { type: Number },
  width:     { type: Number },
  depth:     { type: Number },
}, { _id: false });

// ─── Main schema ─────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Product name is required'],
    trim:     true,
  },
  slug:   { type: String, unique: true },
  brand:  { type: String, required: true, trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  shortDescription: { type: String, maxlength: 200 },

  category: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Category',
    required: true,
  },
  tags: [{ type: String, lowercase: true }],

  // Pricing
  basePrice: {
    type:     Number,
    required: [true, 'Price is required'],
    min:      [0, 'Price cannot be negative'],
  },
  comparePrice:  { type: Number, default: 0 },
  currency:      { type: String, default: 'EUR' },
  taxRate:       { type: Number, default: 0.2 },

  // Media
  images:   { type: [imageSchema], default: [] },

  // Inventory
  variants:     { type: [variantSchema], default: [] },
  totalStock: {
    type: Number,
    default: 0,
  },
  lowStockThreshold: { type: Number, default: 5 },

  // Attributes
  material:     { type: String, default: '' },
  careInstructions: [{ type: String }],
  madeIn:       { type: String, default: '' },
  isLimitedEdition: { type: Boolean, default: false },
  dimensions:   dimensionsSchema,

  // Visibility & status
  isActive:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  publishedAt:  { type: Date },

  // Ratings
  ratingsAverage: { type: Number, default: 0, min: 0, max: 5, set: v => Math.round(v * 10) / 10 },
  ratingsCount:   { type: Number, default: 0 },

  // SEO
  metaTitle:       { type: String, maxlength: 70 },
  metaDescription: { type: String, maxlength: 160 },
}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────
productSchema.index({ category: 1, basePrice: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', brand: 'text', tags: 'text', description: 'text' });

// ─── Virtuals ────────────────────────────────────────────
productSchema.virtual('reviews', {
  ref:          'Review',
  localField:   '_id',
  foreignField: 'product',
});

productSchema.virtual('isOnSale').get(function () {
  return this.comparePrice > 0 && this.comparePrice > this.basePrice;
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.isOnSale) return 0;
  return Math.round(((this.comparePrice - this.basePrice) / this.comparePrice) * 100);
});

productSchema.virtual('primaryImage').get(function () {
  return this.images.find(i => i.isPrimary) || this.images[0] || null;
});

// ─── Pre-save hooks ──────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (this.variants && this.variants.length) {
    this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);