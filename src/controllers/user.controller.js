const User = require("../routes/user.route");
const asyncHandler = require("../utils/asyncHandler");

//Register new User
const registerUser = asyncHandler(async (req, res) => {});

//Login user and create token
const loginUser = asyncHandler(async (req, res) => {});

//logout user and clear token
const logoutUser = asyncHandler(async (req, res) => {});

//Refresh access token using refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {});

//Change user password
const changePassword = asyncHandler(async (req, res) => {});

//Fetch user profile
const getUserProfile = asyncHandler(async (req, res) => {});

//Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {});

//Update user avatar
const updateAvatar = asyncHandler(async (req, res) => {});

//Update user cover image
const updateCoverImage = asyncHandler(async (req, res) => {});

//Fetch current user's channel profile with subscription
const getUserChannelProfile = asyncHandler(async (req, res) => {});

//Fetch user's watch history
const getWatchHistory = asyncHandler(async (req, res) => {});

//Request password reset email
const requestPasswordReset = asyncHandler(async (req, res) => {});

//Reset password using reset token
const resetPassword = asyncHandler(async (req, res) => {});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  requestPasswordReset,
  resetPassword,
};
