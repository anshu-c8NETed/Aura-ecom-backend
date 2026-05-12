'use strict';

const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME, CLIENT_URL } = require('../config/env');

const transporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth:   { user: SMTP_USER, pass: SMTP_PASS },
});

const logoUrl = `${CLIENT_URL}/assets/aura-logo.png`;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: 'Georgia', serif; background:#FAF8F5; color:#1A1714; margin:0; padding:40px 20px; }
    .wrapper { max-width:560px; margin:0 auto; }
    .header { text-align:center; padding:24px 0 32px; letter-spacing:0.3em; font-size:1.4rem; }
    .card { background:#fff; border:1px solid #E8DDD0; padding:40px; }
    .footer { text-align:center; padding:24px 0; font-size:0.72rem; color:#9B8F82; letter-spacing:0.1em; }
    a { color:#B89560; }
    .btn { display:inline-block; background:#1A1714; color:#FAF8F5 !important; padding:14px 32px;
           text-decoration:none; font-family:sans-serif; font-size:0.75rem; letter-spacing:0.18em;
           text-transform:uppercase; margin-top:28px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">AURA</div>
    <div class="card">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} Aura · Paris · Milan · London</div>
  </div>
</body>
</html>`;

const send = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

// ─── Email templates ─────────────────────────────────────
exports.sendWelcomeEmail = async (user, verifyUrl) => {
  await send({
    to: user.email,
    subject: 'Welcome to Aura',
    html: baseTemplate(`
      <p>Dear ${user.firstName},</p>
      <p>Welcome to Aura. We are delighted to have you as part of our community.</p>
      <p>Please verify your email address to complete your registration:</p>
      <a href="${verifyUrl}" class="btn">Verify Email</a>
      <p style="margin-top:28px;font-size:0.8rem;color:#9B8F82;">This link expires in 24 hours.</p>
    `),
  });
};

exports.sendPasswordResetEmail = async (user, resetUrl) => {
  await send({
    to: user.email,
    subject: 'Reset your Aura password',
    html: baseTemplate(`
      <p>Dear ${user.firstName},</p>
      <p>You requested a password reset. Click below to set a new password:</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="margin-top:28px;font-size:0.8rem;color:#9B8F82;">
        This link expires in 1 hour. If you did not request this, please ignore this email.
      </p>
    `),
  });
};

exports.sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;">${i.name} (${i.size || '–'})</td>
      <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;text-align:right;">×${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;text-align:right;">€${i.subtotal.toFixed(2)}</td>
    </tr>
  `).join('');

  await send({
    to: user.email,
    subject: `Order Confirmed · ${order.orderNumber}`,
    html: baseTemplate(`
      <p>Dear ${user.firstName},</p>
      <p>Your order has been confirmed. Here is a summary:</p>
      <p style="font-size:0.8rem;color:#9B8F82;letter-spacing:0.12em;">ORDER ${order.orderNumber}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 0;font-weight:bold;">Total</td>
            <td style="padding:12px 0;text-align:right;font-weight:bold;">€${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <a href="${CLIENT_URL}/account/orders/${order._id}" class="btn">View Order</a>
    `),
  });
};

exports.sendShippingEmail = async (user, order) => {
  await send({
    to: user.email,
    subject: `Your Aura order is on its way · ${order.orderNumber}`,
    html: baseTemplate(`
      <p>Dear ${user.firstName},</p>
      <p>Great news — your order <strong>${order.orderNumber}</strong> has been shipped.</p>
      ${order.trackingNumber ? `
        <p>Carrier: <strong>${order.carrier}</strong></p>
        <p>Tracking: <strong>${order.trackingNumber}</strong></p>
      ` : ''}
      <a href="${CLIENT_URL}/account/orders/${order._id}" class="btn">Track Order</a>
    `),
  });
};