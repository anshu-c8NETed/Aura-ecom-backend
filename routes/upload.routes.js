'use strict';
const router = require('express').Router();
const { uploadController } = require('../controllers/misc.controller');
const { protect, restrict } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

const guard = [protect, restrict('admin')];

router.post('/',   ...guard, upload.array('images', 8), uploadController.uploadImages);
router.delete('/', ...guard, uploadController.deleteImage);

module.exports = router;