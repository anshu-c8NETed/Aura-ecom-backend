'use strict';

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const cookieParser   = require('cookie-parser');
const rateLimit      = require('express-rate-limit');
const { CLIENT_URL } = require('./config/env');
const errorHandler   = require('./middleware/errorHandler');
const notFound       = require('./middleware/notFound');

// ─── Route imports ───────────────────────────────────────
const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const productRoutes  = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes     = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const orderRoutes    = require('./routes/order.routes');
const reviewRoutes   = require('./routes/review.routes');
const paymentRoutes  = require('./routes/payment.routes');
const uploadRoutes   = require('./routes/upload.routes');
const adminRoutes    = require('./routes/admin.routes');

const app = express();

// ─── Security & Parsing ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Stripe webhook needs raw body — register BEFORE json middleware
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Global rate limiter ─────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ─── Auth-specific strict limiter ────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

// ─── Mount routes ────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/admin',      adminRoutes);

// ─── Health check ────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'Aura API is running ✓', timestamp: new Date() })
);

// ─── Error handling ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;