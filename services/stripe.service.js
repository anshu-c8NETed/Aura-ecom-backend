'use strict';

const Stripe   = require('stripe');
const { STRIPE_SECRET_KEY } = require('../config/env');
const stripe   = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

/**
 * Create or retrieve a Stripe customer
 */
exports.getOrCreateCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return stripe.customers.retrieve(user.stripeCustomerId);
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name:  user.fullName,
    metadata: { userId: user._id.toString() },
  });
  user.stripeCustomerId = customer.id;
  await user.save({ validateBeforeSave: false });
  return customer;
};

/**
 * Create a PaymentIntent and return { clientSecret, paymentIntentId }
 */
exports.createPaymentIntent = async ({ amount, currency = 'eur', customerId, metadata = {} }) => {
  const intent = await stripe.paymentIntents.create({
    amount:   Math.round(amount * 100),   // convert to cents
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
};

/**
 * Verify a Stripe webhook signature and return the event
 */
exports.constructWebhookEvent = (payload, sig, secret) =>
  stripe.webhooks.constructEvent(payload, sig, secret);

/**
 * Issue a full or partial refund
 */
exports.refund = async (paymentIntentId, amount) => {
  const params = { payment_intent: paymentIntentId };
  if (amount) params.amount = Math.round(amount * 100);
  return stripe.refunds.create(params);
};