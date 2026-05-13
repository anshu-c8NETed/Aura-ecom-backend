'use strict';

const Product  = require('../models/product.model');
const ApiError = require('../utils/ApiError');
const { ApiFeatures, sendSuccess } = require('../utils/apiHelpers');

// ─── GET /api/products ────────────────────────────────────
exports.getProducts = async (req, res) => {
  const features = new ApiFeatures(
    Product.find({ isActive: true }).populate('category', 'name slug'),
    req.query
  ).filter().search().sort().limitFields().paginate();

  const total    = await Product.countDocuments({ isActive: true });
  const products = await features.query;

  sendSuccess(res, 200, {
    data: { products },
    meta: { ...features.meta, total, pages: Math.ceil(total / (features.meta?.limit || 20)) },
  });
};

// ─── GET /api/products/:slug ──────────────────────────────
exports.getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate({ path: 'reviews', populate: { path: 'user', select: 'firstName lastName avatar' }, match: { isPublished: true } });

  if (!product) throw new ApiError('Product not found.', 404);
  sendSuccess(res, 200, { data: { product } });
};

// ─── GET /api/products/featured ───────────────────────────
exports.getFeaturedProducts = async (_req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(8);
  sendSuccess(res, 200, { data: { products } });
};

// ─── GET /api/products/new-arrivals ───────────────────────
exports.getNewArrivals = async (_req, res) => {
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .populate('category', 'name slug')
    .sort('-publishedAt')
    .limit(8);
  sendSuccess(res, 200, { data: { products } });
};

// ─── POST /api/products  [admin] ──────────────────────────
exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  sendSuccess(res, 201, { data: { product } }, 'Product created.');
};

// ─── PUT /api/products/:id  [admin] ───────────────────────
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) throw new ApiError('Product not found.', 404);
  sendSuccess(res, 200, { data: { product } }, 'Product updated.');
};

// ─── DELETE /api/products/:id  [admin] ────────────────────
exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  );
  if (!product) throw new ApiError('Product not found.', 404);
  sendSuccess(res, 200, {}, 'Product archived.');
};

// ─── PATCH /api/products/:id/stock  [admin] ───────────────
exports.updateStock = async (req, res) => {
  const { variantId, stock } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError('Product not found.', 404);

  const variant = product.variants.id(variantId);
  if (!variant) throw new ApiError('Variant not found.', 404);

  variant.stock  = stock;
  product.totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  await product.save();

  sendSuccess(res, 200, { data: { product } }, 'Stock updated.');
};

// ─── GET /api/products/search ─────────────────────────────
exports.searchProducts = async (req, res) => {
  if (!req.query.q) throw new ApiError('Search query (q) is required.', 400);
  const products = await Product.find({
    $text: { $search: req.query.q },
    isActive: true,
  }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .populate('category', 'name slug');

  sendSuccess(res, 200, { data: { products, count: products.length } });
};