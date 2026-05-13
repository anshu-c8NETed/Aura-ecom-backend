'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/product.controller');
const { protect, restrict } = require('../middleware/auth.middleware');

router.get('/',              ctrl.getProducts);
router.get('/search',        ctrl.searchProducts);
router.get('/featured',      ctrl.getFeaturedProducts);
router.get('/new-arrivals',  ctrl.getNewArrivals);
router.get('/:slug',         ctrl.getProductBySlug);

router.post('/',             protect, restrict('admin'), ctrl.createProduct);
router.put('/:id',           protect, restrict('admin'), ctrl.updateProduct);
router.delete('/:id',        protect, restrict('admin'), ctrl.deleteProduct);
router.patch('/:id/stock',   protect, restrict('admin'), ctrl.updateStock);

module.exports = router;