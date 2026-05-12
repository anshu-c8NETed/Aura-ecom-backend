'use strict';

// ══════════════════════════════════════════════════
//  REVIEW CONTROLLER
// ══════════════════════════════════════════════════
const Review   = require('../models/review.model');
const Order    = require('../models/order.model');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiHelpers');

exports.reviewController = {
  // GET /api/reviews/product/:productId
  getProductReviews: async (req, res) => {
    const reviews = await Review.find({ product: req.params.productId, isPublished: true })
      .populate('user', 'firstName lastName avatar')
      .sort('-createdAt');
    sendSuccess(res, 200, { data: { reviews, count: reviews.length } });
  },

  // POST /api/reviews
  createReview: async (req, res) => {
    const { product, rating, title, body } = req.body;
    const existing = await Review.findOne({ product, user: req.user._id });
    if (existing) throw new ApiError('You have already reviewed this product.', 409);

    const purchasedOrder = await Order.findOne({
      user: req.user._id,
      'items.product': product,
      status: 'delivered',
    });

    const review = await Review.create({
      product, user: req.user._id, rating, title, body,
      isVerifiedPurchase: !!purchasedOrder,
    });
    await review.populate('user', 'firstName lastName avatar');
    sendSuccess(res, 201, { data: { review } }, 'Review submitted.');
  },

  // DELETE /api/reviews/:id
  deleteReview: async (req, res) => {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) throw new ApiError('Review not found.', 404);
    await review.deleteOne();
    sendSuccess(res, 200, {}, 'Review deleted.');
  },
};


// ══════════════════════════════════════════════════
//  USER CONTROLLER
// ══════════════════════════════════════════════════
const User = require('../models/user.model');

exports.userController = {
  // GET /api/users/profile
  getProfile: async (req, res) => {
    sendSuccess(res, 200, { data: { user: req.user } });
  },

  // PATCH /api/users/profile
  updateProfile: async (req, res) => {
    const allowed = ['firstName', 'lastName', 'phone', 'avatar'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    sendSuccess(res, 200, { data: { user } }, 'Profile updated.');
  },

  // PATCH /api/users/change-password
  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      throw new ApiError('Current password is incorrect.', 401);
    user.password = newPassword;
    await user.save();
    sendSuccess(res, 200, {}, 'Password changed.');
  },

  // POST /api/users/addresses
  addAddress: async (req, res) => {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    user.addresses.push(req.body);
    await user.save();
    sendSuccess(res, 200, { data: { addresses: user.addresses } }, 'Address added.');
  },

  // DELETE /api/users/addresses/:addressId
  deleteAddress: async (req, res) => {
    const user = await User.findById(req.user._id);
    user.addresses.pull({ _id: req.params.addressId });
    await user.save();
    sendSuccess(res, 200, { data: { addresses: user.addresses } }, 'Address removed.');
  },
};


// ══════════════════════════════════════════════════
//  CATEGORY CONTROLLER
// ══════════════════════════════════════════════════
const Category = require('../models/category.model');

exports.categoryController = {
  getCategories: async (_req, res) => {
    const cats = await Category.find({ isActive: true }).sort('sortOrder name').populate('children');
    sendSuccess(res, 200, { data: { categories: cats } });
  },
  getCategoryBySlug: async (req, res) => {
    const cat = await Category.findOne({ slug: req.params.slug, isActive: true }).populate('children');
    if (!cat) throw new ApiError('Category not found.', 404);
    sendSuccess(res, 200, { data: { category: cat } });
  },
  createCategory: async (req, res) => {
    const cat = await Category.create(req.body);
    sendSuccess(res, 201, { data: { category: cat } }, 'Category created.');
  },
  updateCategory: async (req, res) => {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cat) throw new ApiError('Category not found.', 404);
    sendSuccess(res, 200, { data: { category: cat } }, 'Category updated.');
  },
  deleteCategory: async (req, res) => {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    sendSuccess(res, 200, {}, 'Category archived.');
  },
};


// ══════════════════════════════════════════════════
//  WISHLIST CONTROLLER
// ══════════════════════════════════════════════════
const Wishlist = require('../models/wishlist.model');

exports.wishlistController = {
  getWishlist: async (req, res) => {
    const wl = await Wishlist.findOne({ user: req.user._id }).populate('products', 'name slug basePrice images brand');
    sendSuccess(res, 200, { data: { wishlist: wl || { products: [] } } });
  },
  toggleProduct: async (req, res) => {
    const { productId } = req.body;
    let wl = await Wishlist.findOne({ user: req.user._id });
    if (!wl) wl = await Wishlist.create({ user: req.user._id, products: [] });

    const idx = wl.products.indexOf(productId);
    let action;
    if (idx > -1) { wl.products.splice(idx, 1); action = 'removed'; }
    else          { wl.products.push(productId); action = 'added'; }

    await wl.save();
    sendSuccess(res, 200, { data: { action, wishlist: wl } }, `Product ${action} from wishlist.`);
  },
};


// ══════════════════════════════════════════════════
//  UPLOAD CONTROLLER
// ══════════════════════════════════════════════════
const { uploadImage, deleteImage } = require('../services/cloudinary.service');

exports.uploadController = {
  uploadImages: async (req, res) => {
    if (!req.files?.length) throw new ApiError('No files provided.', 400);
    const uploads = await Promise.all(
      req.files.map(f => uploadImage(f.buffer, req.query.folder || 'aura/products'))
    );
    sendSuccess(res, 200, { data: { images: uploads } }, 'Images uploaded.');
  },
  deleteImage: async (req, res) => {
    const { publicId } = req.body;
    if (!publicId) throw new ApiError('publicId is required.', 400);
    await deleteImage(publicId);
    sendSuccess(res, 200, {}, 'Image deleted.');
  },
};


// ══════════════════════════════════════════════════
//  PAYMENT CONTROLLER
// ══════════════════════════════════════════════════
const { createPaymentIntent, constructWebhookEvent, refund, getOrCreateCustomer } = require('../services/stripe.service');
const { STRIPE_WEBHOOK_SECRET } = require('../config/env');

exports.paymentController = {
  // POST /api/payments/intent
  createIntent: async (req, res) => {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) throw new ApiError('Order not found.', 404);
    if (order.paymentStatus === 'paid') throw new ApiError('Order is already paid.', 409);

    const customer = await getOrCreateCustomer(req.user);
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount:     order.total,
      currency:   'eur',
      customerId: customer.id,
      metadata:   { orderId: order._id.toString(), orderNumber: order.orderNumber },
    });

    order.stripePaymentIntentId = paymentIntentId;
    await order.save();

    sendSuccess(res, 200, { data: { clientSecret } });
  },

  // POST /api/payments/webhook  (raw body)
  handleWebhook: async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = constructWebhookEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);

    if (event.type === 'payment_intent.succeeded') {
      const pi    = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: pi.id });
      if (order) {
        order.paymentStatus = 'paid';
        order.paidAt        = new Date();
        order.status        = 'confirmed';
        order.statusHistory.push({ status: 'confirmed', message: 'Payment received.' });
        await order.save();
      }
    }
    if (event.type === 'payment_intent.payment_failed') {
      const pi    = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: pi.id });
      if (order) {
        order.statusHistory.push({ status: order.status, message: 'Payment failed.' });
        await order.save();
      }
    }
    res.json({ received: true });
  },

  // POST /api/payments/refund [admin]
  issueRefund: async (req, res) => {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError('Order not found.', 404);
    if (!order.stripePaymentIntentId) throw new ApiError('No payment found for this order.', 400);

    await refund(order.stripePaymentIntentId, amount);
    order.paymentStatus = amount ? 'partially_refunded' : 'refunded';
    order.status        = 'refunded';
    order.statusHistory.push({ status: 'refunded', message: `Refunded €${amount || order.total}.` });
    await order.save();
    sendSuccess(res, 200, {}, 'Refund issued.');
  },
};


// ══════════════════════════════════════════════════
//  ADMIN CONTROLLER
// ══════════════════════════════════════════════════
const Product = require('../models/product.model');

exports.adminController = {
  // GET /api/admin/dashboard
  getDashboard: async (_req, res) => {
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.find().sort('-createdAt').limit(5).populate('user', 'firstName lastName email'),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    sendSuccess(res, 200, {
      data: {
        stats: {
          totalOrders,
          totalRevenue:    totalRevenue[0]?.total || 0,
          totalUsers,
          totalProducts,
        },
        recentOrders,
        ordersByStatus,
      },
    });
  },

  // GET /api/admin/users
  getUsers: async (req, res) => {
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 20;
    const total = await User.countDocuments();
    const users = await User.find().sort('-createdAt').skip((page - 1) * limit).limit(limit);
    sendSuccess(res, 200, { data: { users }, meta: { page, limit, total } });
  },

  // PATCH /api/admin/users/:id
  updateUser: async (req, res) => {
    const allowed = ['isActive', 'role'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) throw new ApiError('User not found.', 404);
    sendSuccess(res, 200, { data: { user } }, 'User updated.');
  },

  // GET /api/admin/orders
  getAllOrders: async (req, res) => {
    const page   = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit  = 20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'firstName lastName email');
    sendSuccess(res, 200, { data: { orders }, meta: { page, limit, total } });
  },
};