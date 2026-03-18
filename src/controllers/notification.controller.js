const User = require("../models/user.model");
const Channel = require("../models/channelAnalytics.model");
const Video = require("../models/video.model");
const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//Fetch user notification
const getUserNotification = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, unreadOnly = false } = req.query;
  const filter = {
    recipient: new ObjectId(req.user._id),
  };
  if (unreadOnly === "true") {
    filter.read = false;
  }
  const notification = await Notification.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
        pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
      },
    },
    {
      $addFields: { sender: { $first: "$sender" } },
    },
    { $sort: { createdAt: -1 } },
    {
      $skip: Number(page - 1) * Number(limit),
    },
    {
      $limit: Number(limit),
    },
  ]);
  //count of unread notification
  const unreadNotificationCount = await Notification.countDocuments({
    recipient: new ObjectId(req.user._id),
    read: false,
  });
  //total notification count
  const totalNotification = await Notification.countDocuments({
    recipient: new ObjectId(req.user._id),
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notification,
        unreadNotificationCount,
        totalNotification,
        currentPage: Number(page),
        totalPage: Math.ceil(Number(totalNotification) / Number(limit)),
      },
      "Notification fetched successfully",
    ),
  );
});

//Mark single notification as read
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  if (!notificationId) {
    throw new ApiError(400, "Notification Id is required");
  }
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { $set: { read: true } },
    { new: true },
  );
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

//Mark all notification as read
const markAllNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.updateMany(
    { recipient: req.user._id },
    { $set: { read: true } },
    { new: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All Notification marked as read"));
});

//delete specific notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  if (!notificationId) {
    throw new ApiError(400, "Notification Id is required");
  }
  const notification = await Notification.findByIdAndDelete({
    _id: notificationId,
    recipient: req.user._id,
  });
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification deleted successfully"),
    );
});

//internal utility function to create notification
const createNotification = async (recipientId, senderId, content, type) => {
  try {
    //check if recipient has enabled notification for this
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return null;
    }
    //check notification settings
    if (
      (type === "SUBSCRIPTION" &&
        recipient.notificationSettings?.subscriptionActivity === false) ||
      ((type === "COMMENT" || type === "REPLY") &&
        recipient.notificationSettings.commentActivity === false)
    ) {
      return null;
    }
    //create notification
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      content,
    });
    return notification;
  } catch (error) {
    console.log("Error creating notification");
    return null;
  }
};

module.exports = {
  getUserNotification,
  markNotificationAsRead,
  markAllNotificationAsRead,
  deleteNotification,
  createNotification,
};
