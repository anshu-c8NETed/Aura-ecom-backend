'use strict';
const router = require('express').Router();
const { categoryController: ctrl } = require('../controllers/misc.controller');
const { protect, restrict } = require('../middleware/auth.middleware');

router.get('/',          ctrl.getCategories);
router.get('/:slug',     ctrl.getCategoryBySlug);
router.post('/',         protect, restrict('admin'), ctrl.createCategory);
router.put('/:id',       protect, restrict('admin'), ctrl.updateCategory);
router.delete('/:id',    protect, restrict('admin'), ctrl.deleteCategory);

module.exports = router;