'use strict';
const router = require('express').Router();
const { paymentController } = require('../controllers/misc.controller');
const { protect, restrict } = require('../middleware/auth.middleware');

router.post('/intent',  protect, paymentController.createIntent);
router.post('/webhook',          paymentController.handleWebhook);
router.post('/refund',  protect, restrict('admin'), paymentController.issueRefund);

module.exports = router;