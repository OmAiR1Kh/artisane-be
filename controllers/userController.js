const User = require("../models/userModel");
const Profile = require("../models/profileModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Update user
 * @route   PUT /api/users
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // If email is being changed, check if new email already exists
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error("Email already in use");
    }
  }

  // Update user
  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.email = email || user.email;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    role: updatedUser.role,
    isVerified: updatedUser.isVerified,
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users
 * @access  Private
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Delete user's profile
  await Profile.findOneAndDelete({ user: req.user.id });

  // Delete user
  await user.deleteOne();

  res.json({ message: "User deleted successfully" });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id, "-__v");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  });
});

/**
 * @desc    Get photographers/videographers
 * @route   GET /api/users/professionals
 * @access  Public
 */
const getProfessionals = asyncHandler(async (req, res) => {
  const { role, limit = 10, page = 1 } = req.query;

  // Build query
  const query = {};

  if (role) {
    query.role = role;
  } else {
    // If no specific role, get both photographers and videographers
    query.role = { $in: ["photographer", "videographer"] };
  }

  // Count total documents for pagination
  const count = await User.countDocuments(query);

  // Execute query with pagination
  const users = await User.find(query)
    .select("_id firstName lastName role createdAt")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    users,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Public
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q, role, limit = 10, page = 1 } = req.query;

  if (!q) {
    res.status(400);
    throw new Error("Search query is required");
  }

  // Build query
  const query = {
    $or: [
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
    ],
  };

  if (role) {
    query.role = role;
  }

  // Count total documents for pagination
  const count = await User.countDocuments(query);

  // Execute query with pagination
  const users = await User.find(query)
    .select("_id firstName lastName role createdAt")
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  res.json({
    users,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

module.exports = {
  updateUser,
  deleteUser,
  getUserById,
  getProfessionals,
  searchUsers,
};
