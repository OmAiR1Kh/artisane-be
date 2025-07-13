const Profile = require("../models/profileModel");
const Review = require("../models/reviewModel");
const asyncHandler = require("express-async-handler");
const { uploadImage } = require("../utils/fileUpload");

/**
 * @desc    Get current user's profile
 * @route   GET /api/profiles/me
 * @access  Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).populate(
    "user",
    "firstName lastName email role"
  );

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  // Get average rating
  const averageRating = await profile.calculateAverageRating();

  res.json({
    ...profile.toObject(),
    averageRating,
  });
});

/**
 * @desc    Get profile by user ID
 * @route   GET /api/profiles/user/:userId
 * @access  Public
 */
const getProfileByUserId = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({
    user: req.params.userId,
    visibility: "public",
  }).populate("user", "firstName lastName role");

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found or is set to private");
  }

  // Get average rating
  const averageRating = await profile.calculateAverageRating();

  res.json({
    ...profile.toObject(),
    averageRating,
  });
});

/**
 * @desc    Update profile
 * @route   PUT /api/profiles
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    displayName,
    bio,
    location,
    specializations,
    equipment,
    pricing,
    experience,
    contact,
    availability,
    visibility,
  } = req.body;

  let profile = await Profile.findOne({ user: req.user.id });

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  // Update fields
  profile.displayName = displayName || profile.displayName;
  profile.bio = bio || profile.bio;

  if (location) {
    profile.location = {
      ...profile.location,
      ...location,
    };
  }

  if (specializations) {
    profile.specializations = specializations;
  }

  if (equipment) {
    profile.equipment = equipment;
  }

  if (pricing) {
    profile.pricing = {
      ...profile.pricing,
      ...pricing,
    };
  }

  if (experience) {
    profile.experience = {
      ...profile.experience,
      ...experience,
    };
  }

  if (contact) {
    profile.contact = {
      ...profile.contact,
      ...contact,
    };
  }

  if (contact && contact.socialMedia) {
    profile.contact.socialMedia = {
      ...profile.contact.socialMedia,
      ...contact.socialMedia,
    };
  }

  if (availability) {
    profile.availability = availability;
  }

  if (visibility) {
    profile.visibility = visibility;
  }

  const updatedProfile = await profile.save();

  // Get average rating
  const averageRating = await updatedProfile.calculateAverageRating();

  res.json({
    ...updatedProfile.toObject(),
    averageRating,
  });
});

/**
 * @desc    Upload profile image
 * @route   POST /api/profiles/upload-profile-image
 * @access  Private
 */
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image");
  }

  const profile = await Profile.findOne({ user: req.user.id });

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  // Process and upload image
  const imagePath = await uploadImage(req.file, "profiles", 300);

  // Update profile with new image
  profile.profileImage = imagePath;
  await profile.save();

  res.json({
    message: "Profile image uploaded successfully",
    profileImage: imagePath,
  });
});

/**
 * @desc    Upload cover image
 * @route   POST /api/profiles/upload-cover-image
 * @access  Private
 */
const uploadCoverImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image");
  }

  const profile = await Profile.findOne({ user: req.user.id });

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  // Process and upload image (wider dimensions for cover)
  const imagePath = await uploadImage(req.file, "covers", 800);

  // Update profile with new cover image
  profile.coverImage = imagePath;
  await profile.save();

  res.json({
    message: "Cover image uploaded successfully",
    coverImage: imagePath,
  });
});

/**
 * @desc    Search profiles
 * @route   GET /api/profiles/search
 * @access  Public
 */
const searchProfiles = asyncHandler(async (req, res) => {
  const {
    q,
    specialization,
    location,
    minRating,
    maxPrice,
    availability,
    limit = 10,
    page = 1,
  } = req.query;

  // Build query
  const query = { visibility: "public" };

  // Text search
  if (q) {
    query.$or = [
      { displayName: { $regex: q, $options: "i" } },
      { bio: { $regex: q, $options: "i" } },
      { "location.city": { $regex: q, $options: "i" } },
      { "location.state": { $regex: q, $options: "i" } },
      { "location.country": { $regex: q, $options: "i" } },
    ];
  }

  // Filter by specialization
  if (specialization) {
    query.specializations = { $in: [specialization] };
  }

  // Filter by location
  if (location) {
    query.$or = query.$or || [];
    query.$or.push(
      { "location.city": { $regex: location, $options: "i" } },
      { "location.state": { $regex: location, $options: "i" } },
      { "location.country": { $regex: location, $options: "i" } }
    );
  }

  // Filter by availability
  if (availability) {
    query.availability = availability;
  }

  // Filter by price (hourly rate)
  if (maxPrice) {
    query["pricing.hourlyRate"] = { $lte: Number(maxPrice) };
  }

  // Count total documents for pagination
  const count = await Profile.countDocuments(query);

  // Execute query with pagination
  const profiles = await Profile.find(query)
    .populate("user", "firstName lastName role")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ updatedAt: -1 });

  // Get ratings for profiles
  const profilesWithRatings = await Promise.all(
    profiles.map(async (profile) => {
      const rating = await profile.calculateAverageRating();
      return {
        ...profile.toObject(),
        averageRating: rating,
      };
    })
  );

  // Filter by minimum rating if specified
  let filteredProfiles = profilesWithRatings;
  if (minRating) {
    filteredProfiles = profilesWithRatings.filter(
      (profile) => profile.averageRating >= Number(minRating)
    );
  }

  res.json({
    profiles: filteredProfiles,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: filteredProfiles.length,
  });
});

/**
 * @desc    Get nearby profiles
 * @route   GET /api/profiles/nearby
 * @access  Public
 */
const getNearbyProfiles = asyncHandler(async (req, res) => {
  const { longitude, latitude, distance = 50, limit = 10 } = req.query;

  if (!longitude || !latitude) {
    res.status(400);
    throw new Error("Please provide longitude and latitude");
  }

  // Find profiles within the specified distance (in kilometers)
  const profiles = await Profile.find({
    visibility: "public",
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        $maxDistance: parseInt(distance) * 1000, // Convert to meters
      },
    },
  })
    .populate("user", "firstName lastName role")
    .limit(Number(limit));

  // Get ratings for profiles
  const profilesWithRatings = await Promise.all(
    profiles.map(async (profile) => {
      const rating = await profile.calculateAverageRating();
      return {
        ...profile.toObject(),
        averageRating: rating,
      };
    })
  );

  res.json({
    profiles: profilesWithRatings,
    total: profilesWithRatings.length,
  });
});

module.exports = {
  getMyProfile,
  getProfileByUserId,
  updateProfile,
  uploadProfileImage,
  uploadCoverImage,
  searchProfiles,
  getNearbyProfiles,
};
