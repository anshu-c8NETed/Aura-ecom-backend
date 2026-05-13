'use strict';

const Order    = require('../models/order.model');
const Cart     = require('../models/cart.model');
const Product  = require('../models/product.model');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiHelpers');
const { sendOrderConfirmationEmail, sendShippingEmail } = require('../services/email.service');

const SHIPPING_THRESHOLD = 300;   // free shipping above €300
const SHIPPING_COST      = 12;    // €12 flat rate

// ─── POST /api/orders ─────────────────────────────────────
exports.createOrder = async (req, res) => {
  const { shippingAddress, billingAddress, couponCode, customerNote } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || !cart.items.length) throw new ApiError('Your cart is empty.', 400);

  // Validate stock for every item
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) throw new ApiError(`"${item.name}" is no longer available.`, 409);
    const variant = product.variants.id(item.variantId);
    if (!variant || variant.stock < item.quantity)
      throw new ApiError(`Insufficient stock for "${item.name}" in size ${item.size}.`, 409);
  }

  const subtotal     = cart.subtotal;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discount     = cart.discount || 0;
  const taxAmount    = parseFloat(((subtotal - discount) * 0.2).toFixed(2));
  const total        = parseFloat((subtotal + shippingCost - discount + taxAmount).toFixed(2));

  const orderItems = cart.items.map(i => ({
    product:   i.product._id,
    variantId: i.variantId,
    name:      i.name,
    brand:     i.product.brand,
    image:     i.image,
    size:      i.size,
    color:     i.color,
    sku:       i.product.variants.id(i.variantId)?.sku || '',
    price:     i.price,
    quantity:  i.quantity,
    subtotal:  parseFloat((i.price * i.quantity).toFixed(2)),
  }));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    subtotal,
    shippingCost,
    taxAmount,
    discount,
    total,
    currency:     'EUR',
    couponCode:   couponCode || '',
    customerNote: customerNote || '',
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.findOneAndUpdate(
      { _id: item.product._id, 'variants._id': item.variantId },
      { $inc: { 'variants.$.stock': -item.quantity, totalStock: -item.quantity } }
    );
  }

  // Clear cart
  await Cart.findByIdAndDelete(cart._id);

  // Send confirmation email
  await sendOrderConfirmationEmail(req.user, order).catch(() => {});

  sendSuccess(res, 201, { data: { order } }, 'Order placed successfully.');
};

// ─── GET /api/orders (my orders) ─────────────────────────
exports.getMyOrders = async (req, res) => {
  const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 10;
  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);
  sendSuccess(res, 200, {
    data: { orders },
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// ─── GET /api/orders/:id ──────────────────────────────────
exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError('Order not found.', 404);
  sendSuccess(res, 200, { data: { order } });
};

// ─── PATCH /api/orders/:id/status [admin] ────────────────
exports.updateOrderStatus = async (req, res) => {
  const { status, message, trackingNumber, carrier } = req.body;
  const order = await Order.findById(req.params.id).populate('user', 'firstName email');
  if (!order) throw new ApiError('Order not found.', 404);

  const allowed = {
    pending:    ['confirmed', 'cancelled'],
    confirmed:  ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped:    ['delivered'],
    delivered:  ['refunded'],
  };

  if (allowed[order.status] && !allowed[order.status].includes(status))
    throw new ApiError(`Cannot transition order from "${order.status}" to "${status}".`, 422);

  order.status = status;
  order.statusHistory.push({ status, message: message || '' });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (carrier)        order.carrier = carrier;
  if (status === 'shipped') {
    order.shippedAt = new Date();
    await sendShippingEmail(order.user, order).catch(() => {});
  }
  if (status === 'delivered') order.deliveredAt = new Date();

  await order.save();
  sendSuccess(res, 200, { data: { order } }, 'Order status updated.');
};

// ─── POST /api/orders/:id/cancel ─────────────────────────
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError('Order not found.', 404);
  if (!['pending', 'confirmed'].includes(order.status))
    throw new ApiError('This order can no longer be cancelled.', 422);

  // Restore stock
  for (const item of order.items) {
    await Product.findOneAndUpdate(
      { _id: item.product, 'variants._id': item.variantId },
      { $inc: { 'variants.$.stock': item.quantity, totalStock: item.quantity } }
    );
  }

  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', message: 'Cancelled by customer.' });
  await order.save();
  sendSuccess(res, 200, { data: { order } }, 'Order cancelled.');
};