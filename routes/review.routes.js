'use strict';
const router = require('express').Router();
const { reviewController } = require('../controllers/misc.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/',        protect,  reviewController.createReview);
router.delete('/:id',   protect,  reviewController.deleteReview);

module.exports = router;