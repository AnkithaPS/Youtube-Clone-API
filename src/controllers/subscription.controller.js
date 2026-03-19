const mongoose = require("mongoose");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { createNotification } = require("./notification.controller");

//Toggle subscription status for a channel (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }
  //Check if channel exists
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  // Cannot subscribe to your own channel
  if (channelId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }
  // Check if already subscribed
  const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  let message;
  if (subscription) {
    //Unsubscribe
    await Subscription.findByIdAndDelete(subscription._id);
    message = "Unsubscribed successfully";
  } else {
    //Subscribe
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    message = "Subscribed successfully";
    // Create notification for channel owner
    await createNotification(
      channelId,
      req.user._id,
      "SUBSCRIPTION",
      `${req.user.fullName} subscribed to your channel`,
    );
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});

// Get all channels that a user has subscribed to
const getUserSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const subscriberIdToUse = subscriberId || req.user._id;
  if (!subscriberIdToUse) {
    throw new ApiError(400, "Subscriber ID is required");
  }
  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberIdToUse),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              coverImage: 1,
              channelDescription: 1,
              channelTags: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channelInfo: { $first: "$channelInfo" },
      },
    },
    {
      $project: {
        _id: 0,
        channelInfo: 1,
        subscribedAt: "$createdAt",
      },
    },
  ]);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscriptions,
        totalSubscriptions: subscriptions.length,
      },
      "Subscribed channels fetched successfully",
    ),
  );
});

//Get all subscribers of a channel
const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const channelIdToUse = channelId || req.user._id;
  if (!channelIdToUse) {
    throw new ApiError(400, "Channel ID is required");
  }
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelIdToUse),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriberInfo: { $first: "$subscriberInfo" },
      },
    },
    {
      $project: {
        _id: 0,
        subscriberInfo: 1,
        subscribedAt: "$createdAt",
      },
    },
  ]);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribers,
        totalSubscribers: subscribers.length,
      },
      "Channels subscribers fetched successfully",
    ),
  );
});

module.exports = {
  toggleSubscription,
  getChannelSubscribers,
  getUserSubscribedChannels,
};
