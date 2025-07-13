const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  getProfileByUserId,
  updateProfile,
  uploadProfileImage,
  uploadCoverImage,
  searchProfiles,
  getNearbyProfiles
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateProfileValidation } = require('../utils/validationSchemas');

// Public routes
router.get('/user/:userId', getProfileByUserId);
router.get('/search', searchProfiles);
router.get('/nearby', getNearbyProfiles);

// Protected routes
router.get('/me', protect, getMyProfile);
router.put('/', protect, validate(updateProfileValidation), updateProfile);
router.post(
  '/upload-profile-image',
  protect,
  uploadMiddleware.single('image'),
  uploadProfileImage
);
router.post(
  '/upload-cover-image',
  protect,
  uploadMiddleware.single('image'),
  uploadCoverImage
);

module.exports = router;