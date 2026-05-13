'use strict';
const router    = require('express').Router();
const orderCtrl = require('../controllers/order.controller');
const { protect, restrict } = require('../middleware/auth.middleware');

router.post('/',              protect, orderCtrl.createOrder);
router.get('/',               protect, orderCtrl.getMyOrders);
router.get('/:id',            protect, orderCtrl.getOrder);
router.post('/:id/cancel',    protect, orderCtrl.cancelOrder);
router.patch('/:id/status',   protect, restrict('admin'), orderCtrl.updateOrderStatus);

module.exports = router;