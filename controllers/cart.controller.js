'use strict';

const Cart     = require('../models/cart.model');
const Product  = require('../models/product.model');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiHelpers');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId });
  return cart;
};

// ─── GET /api/cart ────────────────────────────────────────
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name isActive');
  sendSuccess(res, 200, { data: { cart: cart || { items: [], subtotal: 0, total: 0 } } });
};

// ─── POST /api/cart ───────────────────────────────────────
exports.addItem = async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;
  if (!productId || !variantId) throw new ApiError('productId and variantId are required.', 400);

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError('Product not found.', 404);

  const variant = product.variants.id(variantId);
  if (!variant) throw new ApiError('Variant not found.', 404);
  if (variant.stock < quantity) throw new ApiError('Insufficient stock.', 409);

  const cart    = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    i => i.product.toString() === productId && i.variantId.toString() === variantId
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (variant.stock < newQty) throw new ApiError('Insufficient stock for that quantity.', 409);
    existing.quantity = newQty;
  } else {
    cart.items.push({
      product:   productId,
      variantId,
      name:      product.name,
      image:     product.primaryImage?.url || '',
      size:      variant.size,
      color:     variant.color,
      price:     variant.price || product.basePrice,
      quantity,
    });
  }

  await cart.save();
  sendSuccess(res, 200, { data: { cart } }, 'Item added to cart.');
};

// ─── PATCH /api/cart/:itemId ──────────────────────────────
exports.updateItem = async (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) throw new ApiError('Quantity must be at least 1.', 400);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError('Item not found in cart.', 404);

  item.quantity = quantity;
  await cart.save();
  sendSuccess(res, 200, { data: { cart } }, 'Cart updated.');
};

// ─── DELETE /api/cart/:itemId ─────────────────────────────
exports.removeItem = async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items.pull({ _id: req.params.itemId });
  await cart.save();
  sendSuccess(res, 200, { data: { cart } }, 'Item removed from cart.');
};

// ─── DELETE /api/cart ─────────────────────────────────────
exports.clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  sendSuccess(res, 200, {}, 'Cart cleared.');
};