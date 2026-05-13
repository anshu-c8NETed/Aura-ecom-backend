'use strict';
const router   = require('express').Router();
const cartCtrl = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/',           protect, cartCtrl.getCart);
router.post('/',          protect, cartCtrl.addItem);
router.patch('/:itemId',  protect, cartCtrl.updateItem);
router.delete('/:itemId', protect, cartCtrl.removeItem);
router.delete('/',        protect, cartCtrl.clearCart);

module.exports = router;