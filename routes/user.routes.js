'use strict';
// ── user.routes.js ──
const router  = require('express').Router();
const { userController: ctrl } = require('../controllers/misc.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/profile',                    protect, ctrl.getProfile);
router.patch('/profile',                  protect, ctrl.updateProfile);
router.patch('/change-password',          protect, ctrl.changePassword);
router.post('/addresses',                 protect, ctrl.addAddress);
router.delete('/addresses/:addressId',    protect, ctrl.deleteAddress);

module.exports = router;