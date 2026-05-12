'use strict';
const router = require('express').Router();

// ── cart.routes.js content (exported separately below) ──
const cartCtrl = require('../controllers/cart.controller');
const { wishlistController, reviewController, uploadController, paymentController, adminController } = require('../controllers/misc.controller');
const orderCtrl = require('../controllers/order.controller');
const { protect, restrict } = require('../middleware/auth.middleware');
const { upload }  = require('../middleware/upload.middleware');

// Cart
const cartRouter = require('express').Router();
cartRouter.get('/',             protect, cartCtrl.getCart);
cartRouter.post('/',            protect, cartCtrl.addItem);
cartRouter.patch('/:itemId',    protect, cartCtrl.updateItem);
cartRouter.delete('/:itemId',   protect, cartCtrl.removeItem);
cartRouter.delete('/',          protect, cartCtrl.clearCart);

// Wishlist
const wishlistRouter = require('express').Router();
wishlistRouter.get('/',         protect, wishlistController.getWishlist);
wishlistRouter.post('/toggle',  protect, wishlistController.toggleProduct);

// Reviews
const reviewRouter = require('express').Router();
reviewRouter.get('/product/:productId',  reviewController.getProductReviews);
reviewRouter.post('/',        protect,   reviewController.createReview);
reviewRouter.delete('/:id',   protect,   reviewController.deleteReview);

// Orders
const orderRouter = require('express').Router();
orderRouter.post('/',           protect, orderCtrl.createOrder);
orderRouter.get('/',            protect, orderCtrl.getMyOrders);
orderRouter.get('/:id',         protect, orderCtrl.getOrder);
orderRouter.post('/:id/cancel', protect, orderCtrl.cancelOrder);
orderRouter.patch('/:id/status', protect, restrict('admin'), orderCtrl.updateOrderStatus);

// Payments
const paymentRouter = require('express').Router();
paymentRouter.post('/intent',   protect, paymentController.createIntent);
paymentRouter.post('/webhook',           paymentController.handleWebhook);
paymentRouter.post('/refund',   protect, restrict('admin'), paymentController.issueRefund);

// Upload
const uploadRouter = require('express').Router();
uploadRouter.post('/',   protect, restrict('admin'), upload.array('images', 8), uploadController.uploadImages);
uploadRouter.delete('/', protect, restrict('admin'), uploadController.deleteImage);

// Admin
const adminRouter = require('express').Router();
adminRouter.get('/dashboard', protect, restrict('admin'), adminController.getDashboard);
adminRouter.get('/users',     protect, restrict('admin'), adminController.getUsers);
adminRouter.patch('/users/:id', protect, restrict('admin'), adminController.updateUser);
adminRouter.get('/orders',    protect, restrict('admin'), adminController.getAllOrders);

module.exports = { cartRouter, wishlistRouter, reviewRouter, orderRouter, paymentRouter, uploadRouter, adminRouter };