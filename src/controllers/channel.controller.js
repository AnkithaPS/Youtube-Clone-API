const User = require("../models/user.model");
const Channel = require("../models/channelAnalytics.model");
const Video = require("../models/video.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");

//Get channel information
const getChannelInfo = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "Username is required");
  }
  const channel = await User.findOne({ username }).select(
    "-password -refreshToken -watchHistory -email -notificationSettings -isVerified",
  );
  if (!channel) {
    throw new ApiError(404, "Channel not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { channel }, "Channel information"));
});

//Update channel information
const updateChannelInfo = asyncHandler(async (req, res) => {
  const { channelDescription, channelTags, socialLinks } = req.body;
  const updateData = {};
  if (channelDescription !== undefined) {
    updateData.channelDescription = channelDescription;
  }
  if (channelTags !== undefined) {
    updateData.channelTags = Array.isArray(channelTags)
      ? channelTags
      : JSON.parse(channelTags);
  }
  if (socialLinks !== undefined) {
    updateData.socialLinks =
      typeof socialLinks === "object" ? socialLinks : JSON.parse(socialLinks);
  }
  if (req?.files?.coverImage[0]?.path) {
    if (req?.user?.CoverImage) {
      await deleteFromCloudinary(
        req.user.coverImage.public_id,
        "youtube/cover-image",
      );
    }
    const result = await uploadToCloudinary(
      req.files.coverImage[0].path,
      "youtube/cover-image",
    );
    if (!result) {
      throw new ApiError(400, "Error uploading cover image");
    }
    updateData.coverImage = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }
  const updateChannel = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
  }).select("-password -refreshToken ");
  return res
    .status(200)
    .json(new ApiResponse(200, updateChannel, "Channel updated successfully!"));
});

//Update channel notification
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { emailNotification, subscriptionActivity, commentActivity } = req.body;
  let notificationSettings = {};
  if (emailNotification !== undefined) {
    notificationSettings["notificationSettings.emailNotification"] =
      emailNotification;
  }
  if (subscriptionActivity !== undefined) {
    notificationSettings["notificationSettings.subscriptionActivity"] =
      subscriptionActivity;
  }
  if (commentActivity !== undefined) {
    notificationSettings["notificationSettings.commentActivity"] =
      commentActivity;
  }
  if (Object.keys(notificationSettings).length === 0) {
    throw new ApiError(400, "No settings provided to update");
  }
  const updateUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: notificationSettings,
    },
    { new: true },
  ).select("notificationSettings");

  if (!updateUser) {
    throw new ApiError(400, "Error updating notification settings");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateUser,
        "Notification settings updated successfully!",
      ),
    );
});

//Fetch channel videos
const getChannelVideo = asyncHandler(async (req, res) => {});

//Get channel share link
const getChannelShareLink = asyncHandler(async (req, res) => {});

module.exports = {
  getChannelInfo,
  updateChannelInfo,
  updateNotificationSettings,
  getChannelVideo,
  getChannelShareLink,
};
