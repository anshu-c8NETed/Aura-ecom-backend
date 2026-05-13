'use strict';
const router = require('express').Router();
const { adminController } = require('../controllers/misc.controller');
const { protect, restrict } = require('../middleware/auth.middleware');

const guard = [protect, restrict('admin')];

router.get('/dashboard',    ...guard, adminController.getDashboard);
router.get('/users',        ...guard, adminController.getUsers);
router.patch('/users/:id',  ...guard, adminController.updateUser);
router.get('/orders',       ...guard, adminController.getAllOrders);

module.exports = router;