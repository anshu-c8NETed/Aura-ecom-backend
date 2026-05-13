'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register',              ctrl.register);
router.post('/login',                 ctrl.login);
router.post('/refresh',               ctrl.refresh);
router.post('/logout',   protect,     ctrl.logout);
router.get('/me',        protect,     ctrl.getMe);
router.get('/verify-email/:token',    ctrl.verifyEmail);
router.post('/forgot-password',       ctrl.forgotPassword);
router.patch('/reset-password/:token', ctrl.resetPassword);

module.exports = router;