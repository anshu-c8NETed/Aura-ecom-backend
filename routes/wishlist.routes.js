'use strict';
const router = require('express').Router();
const { wishlistController } = require('../controllers/misc.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/',         protect, wishlistController.getWishlist);
router.post('/toggle',  protect, wishlistController.toggleProduct);

module.exports = router;