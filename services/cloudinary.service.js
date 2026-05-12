'use strict';

const cloudinary = require('../config/cloudinary');
const ApiError   = require('../utils/ApiError');

/**
 * Upload a buffer to Cloudinary and return { url, publicId }
 */
exports.uploadImage = (buffer, folder = 'aura/products') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => {
        if (err) return reject(new ApiError(`Cloudinary upload failed: ${err.message}`, 500));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

/**
 * Delete an image from Cloudinary by publicId
 */
exports.deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};