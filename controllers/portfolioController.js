const PortfolioItem = require("../models/portfolioModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const {
  uploadMedia,
  generateThumbnail,
  deleteFile,
} = require("../utils/fileUpload");

/**
 * @desc    Get portfolio items for current user
 * @route   GET /api/portfolios/me
 * @access  Private
 */
const getMyPortfolio = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;

  // Count total documents for pagination
  const count = await PortfolioItem.countDocuments({ user: req.user.id });

  const portfolioItems = await PortfolioItem.find({ user: req.user.id })
    .sort({ featured: -1, createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({
    portfolioItems,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

/**
 * @desc    Get portfolio item by ID
 * @route   GET /api/portfolios/:id
 * @access  Public/Private (depending on visibility)
 */
const getPortfolioItemById = asyncHandler(async (req, res) => {
  const portfolioItem = await PortfolioItem.findById(req.params.id).populate(
    "user",
    "firstName lastName"
  );

  if (!portfolioItem) {
    res.status(404);
    throw new Error("Portfolio item not found");
  }

  // Check if item is public or belongs to the current user
  if (
    !portfolioItem.isPublic &&
    (!req.user || portfolioItem.user._id.toString() !== req.user.id)
  ) {
    res.status(403);
    throw new Error("Not authorized to access this portfolio item");
  }

  // Increment view count if not the owner
  if (req.user && portfolioItem.user._id.toString() !== req.user.id) {
    portfolioItem.stats.views += 1;
    await portfolioItem.save();
  }

  res.json(portfolioItem);
});

/**
 * @desc    Get public portfolio items by user ID
 * @route   GET /api/portfolios/user/:userId
 * @access  Public
 */
const getUserPortfolio = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const userId = req.params.userId;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Build query (only public items unless it's the owner)
  const query = {
    user: userId,
    isPublic: true,
  };

  // If it's the owner, show all items
  if (req.user && req.user.id === userId) {
    delete query.isPublic;
  }

  // Count total documents for pagination
  const count = await PortfolioItem.countDocuments(query);

  const portfolioItems = await PortfolioItem.find(query)
    .sort({ featured: -1, createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({
    portfolioItems,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

/**
 * @desc    Create portfolio item
 * @route   POST /api/portfolios
 * @access  Private
 */
const createPortfolioItem = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a media file");
  }

  const {
    title,
    description,
    categories,
    tags,
    location,
    client,
    date,
    isPublic,
    metadata,
  } = req.body;

  // Check if user is a photographer or videographer
  const user = await User.findById(req.user.id);
  if (!["photographer", "videographer", "admin"].includes(user.role)) {
    res.status(403);
    throw new Error(
      "Only photographers or videographers can create portfolio items"
    );
  }

  // Determine media type from mimetype
  const mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";

  // Process and upload media
  const mediaUrl = await uploadMedia(req.file, "portfolio");

  // Generate thumbnail if it's a video
  let thumbnailUrl = "";
  if (mediaType === "video") {
    thumbnailUrl = await generateThumbnail(mediaUrl);
  }

  // Parse categories and tags if they are stringified arrays
  const parsedCategories = categories
    ? typeof categories === "string"
      ? JSON.parse(categories)
      : categories
    : [];

  const parsedTags = tags
    ? typeof tags === "string"
      ? JSON.parse(tags)
      : tags
    : [];

  // Parse location if provided
  let parsedLocation = {};
  if (location) {
    parsedLocation =
      typeof location === "string" ? JSON.parse(location) : location;
  }

  // Parse metadata if provided
  let parsedMetadata = {};
  if (metadata) {
    parsedMetadata =
      typeof metadata === "string" ? JSON.parse(metadata) : metadata;
  }

  // Create portfolio item
  const portfolioItem = await PortfolioItem.create({
    user: req.user.id,
    title,
    description,
    mediaType,
    mediaUrl,
    thumbnailUrl,
    categories: parsedCategories,
    tags: parsedTags,
    location: parsedLocation,
    client,
    date: date ? new Date(date) : null,
    isPublic: isPublic === "false" ? false : true,
    metadata: parsedMetadata,
  });

  res.status(201).json(portfolioItem);
});

/**
 * @desc    Update portfolio item
 * @route   PUT /api/portfolios/:id
 * @access  Private
 */
const updatePortfolioItem = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    categories,
    tags,
    location,
    client,
    date,
    isPublic,
    featured,
    metadata,
  } = req.body;

  const portfolioItem = await PortfolioItem.findById(req.params.id);

  if (!portfolioItem) {
    res.status(404);
    throw new Error("Portfolio item not found");
  }

  // Check ownership
  if (portfolioItem.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to update this portfolio item");
  }

  // Parse categories and tags if they are stringified arrays
  const parsedCategories = categories
    ? typeof categories === "string"
      ? JSON.parse(categories)
      : categories
    : portfolioItem.categories;

  const parsedTags = tags
    ? typeof tags === "string"
      ? JSON.parse(tags)
      : tags
    : portfolioItem.tags;

  // Parse location if provided
  let parsedLocation = portfolioItem.location;
  if (location) {
    parsedLocation =
      typeof location === "string" ? JSON.parse(location) : location;
  }

  // Parse metadata if provided
  let parsedMetadata = portfolioItem.metadata;
  if (metadata) {
    parsedMetadata =
      typeof metadata === "string" ? JSON.parse(metadata) : metadata;
  }

  // Update fields
  portfolioItem.title = title || portfolioItem.title;
  portfolioItem.description = description || portfolioItem.description;
  portfolioItem.categories = parsedCategories;
  portfolioItem.tags = parsedTags;
  portfolioItem.location = parsedLocation;
  portfolioItem.client = client || portfolioItem.client;
  portfolioItem.date = date ? new Date(date) : portfolioItem.date;
  portfolioItem.isPublic =
    isPublic === undefined
      ? portfolioItem.isPublic
      : isPublic === "false"
      ? false
      : true;
  portfolioItem.featured =
    featured === undefined
      ? portfolioItem.featured
      : featured === "false"
      ? false
      : true;
  portfolioItem.metadata = parsedMetadata;

  const updatedPortfolioItem = await portfolioItem.save();

  res.json(updatedPortfolioItem);
});

/**
 * @desc    Delete portfolio item
 * @route   DELETE /api/portfolios/:id
 * @access  Private
 */
const deletePortfolioItem = asyncHandler(async (req, res) => {
  const portfolioItem = await PortfolioItem.findById(req.params.id);

  if (!portfolioItem) {
    res.status(404);
    throw new Error("Portfolio item not found");
  }

  // Check ownership
  if (portfolioItem.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to delete this portfolio item");
  }

  // Delete associated files
  await deleteFile(portfolioItem.mediaUrl);
  if (portfolioItem.thumbnailUrl) {
    await deleteFile(portfolioItem.thumbnailUrl);
  }

  // Delete from database
  await portfolioItem.deleteOne();

  res.json({ message: "Portfolio item removed" });
});

/**
 * @desc    Like/unlike portfolio item
 * @route   PUT /api/portfolios/:id/like
 * @access  Private
 */
const toggleLikePortfolioItem = asyncHandler(async (req, res) => {
  const portfolioItem = await PortfolioItem.findById(req.params.id);

  if (!portfolioItem) {
    res.status(404);
    throw new Error("Portfolio item not found");
  }

  // Check if public or belongs to current user
  if (
    !portfolioItem.isPublic &&
    portfolioItem.user.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error("Not authorized to access this portfolio item");
  }

  // Increment like count
  // In a real app, you would track which users liked which items
  // and toggle the like status
  portfolioItem.stats.likes += 1;
  await portfolioItem.save();

  res.json({
    likes: portfolioItem.stats.likes,
  });
});

/**
 * @desc    Search portfolio items
 * @route   GET /api/portfolios/search
 * @access  Public
 */
const searchPortfolioItems = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    tag,
    userId,
    mediaType,
    limit = 12,
    page = 1,
  } = req.query;

  // Build query (only public items)
  const query = { isPublic: true };

  // Text search
  if (q) {
    query.$text = { $search: q };
  }

  // Filter by category
  if (category) {
    query.categories = { $in: [category] };
  }

  // Filter by tag
  if (tag) {
    query.tags = { $in: [tag] };
  }

  // Filter by user
  if (userId) {
    query.user = userId;
  }

  // Filter by media type
  if (mediaType && ["image", "video"].includes(mediaType)) {
    query.mediaType = mediaType;
  }

  // Count total documents for pagination
  const count = await PortfolioItem.countDocuments(query);

  // Get sorting criteria
  let sort = {};

  // Default sort by featured and creation date
  sort = { featured: -1, createdAt: -1 };

  // Add text score if searching
  if (q) {
    sort.score = { $meta: "textScore" };
  }

  const portfolioItems = await PortfolioItem.find(query)
    .populate("user", "firstName lastName")
    .sort(sort)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({
    portfolioItems,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

/**
 * @desc    Update portfolio item media
 * @route   PUT /api/portfolios/:id/media
 * @access  Private
 */
const updatePortfolioMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload a media file");
  }

  const portfolioItem = await PortfolioItem.findById(req.params.id);

  if (!portfolioItem) {
    res.status(404);
    throw new Error("Portfolio item not found");
  }

  // Check ownership
  if (portfolioItem.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to update this portfolio item");
  }

  // Store old media paths for deletion
  const oldMediaUrl = portfolioItem.mediaUrl;
  const oldThumbnailUrl = portfolioItem.thumbnailUrl;

  // Determine media type from mimetype
  const mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";

  // Process and upload media
  const mediaUrl = await uploadMedia(req.file, "portfolio");

  // Generate thumbnail if it's a video
  let thumbnailUrl = "";
  if (mediaType === "video") {
    thumbnailUrl = await generateThumbnail(mediaUrl);
  }

  // Update portfolio item
  portfolioItem.mediaType = mediaType;
  portfolioItem.mediaUrl = mediaUrl;
  portfolioItem.thumbnailUrl = thumbnailUrl;

  await portfolioItem.save();

  // Delete old files
  await deleteFile(oldMediaUrl);
  if (oldThumbnailUrl) {
    await deleteFile(oldThumbnailUrl);
  }

  res.json({
    message: "Media updated successfully",
    mediaUrl,
    thumbnailUrl,
    mediaType,
  });
});

/**
 * @desc    Get featured portfolio items
 * @route   GET /api/portfolios/featured
 * @access  Public
 */
const getFeaturedItems = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const portfolioItems = await PortfolioItem.find({
    isPublic: true,
    featured: true,
  })
    .populate("user", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json(portfolioItems);
});

module.exports = {
  getMyPortfolio,
  getPortfolioItemById,
  getUserPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  toggleLikePortfolioItem,
  searchPortfolioItems,
  updatePortfolioMedia,
  getFeaturedItems,
};
