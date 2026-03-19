const User = require("../models/user.model");
const Channel = require("../models/channelAnalytics.model");
const Like = require("../models/like.model");
const Subscription = require("../models/subscription.model");
const Comment = require("../models/comment.model");
const Video = require("../models/video.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const ChannelAnalytics = require("../models/channelAnalytics.model");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//Fetch channel analytics overview
const getChannelAnalyticsOverview = asyncHandler(async (req, res) => {
  const channelId = req?.params?.channelId
    ? req.params.channelId
    : req.user._id;
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel Not fount!");
  }
  //check user authorized to view analytics
  if (channelId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You don't have permission to view this analytics");
  }
  //Get or  create analytics
  let analytics = await ChannelAnalytics.findOne({ channel: channelId });
  if (!analytics) {
    analytics = await updateChannelAnalytics(channelId);
  }
  return res
    .status(200)
    .json(new ApiResponse(200, analytics, "Channel analytics Overviews"));
});

//Fetch channel detailed analytics
const getChannelDetailedAnalytics = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { startDate, endDate } = req.query;

  // Validate channel
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  // Check if channel exists
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Check if user is authorized to view analytics
  if (channelId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You don't have permission to view these analytics",
    );
  }

  // Parse dates
  const startDateTime = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
  const endDateTime = endDate ? new Date(endDate) : new Date();

  // Validate dates
  if (startDateTime > endDateTime) {
    throw new ApiError(400, "Start date cannot be after end date");
  }

  // Get analytics for the specified time period
  const analytics = await ChannelAnalytics.findOne({ channel: channelId });

  if (!analytics) {
    throw new ApiError(404, "Analytics not found for this channel");
  }

  // Filter daily stats by date range
  const filteredDailyStats = analytics.dailyStats.filter((stat) => {
    const statDate = new Date(stat.date);
    return statDate >= startDateTime && statDate <= endDateTime;
  });

  // Calculate totals for the period
  const periodTotals = filteredDailyStats.reduce(
    (acc, stat) => {
      acc.views += stat.views;
      acc.subscribersGained += stat.subscribersGained;
      acc.subscribersLost += stat.subscribersLost;
      acc.likes += stat.likes;
      acc.comments += stat.comments;
      return acc;
    },
    {
      views: 0,
      subscribersGained: 0,
      subscribersLost: 0,
      likes: 0,
      comments: 0,
    },
  );

  // Get most popular videos
  const popularVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
        createdAt: { $gte: startDateTime, $lte: endDateTime },
      },
    },
    {
      $sort: { views: -1 },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        channelTotals: {
          totalViews: analytics.totalViews,
          totalSubscribers: analytics.totalSubscribers,
          totalVideos: analytics.totalVideos,
          totalLikes: analytics.totalLikes,
          totalComments: analytics.totalComments,
        },
        periodTotals,
        dailyStats: filteredDailyStats,
        popularVideos,
        dateRange: {
          startDate: startDateTime,
          endDate: endDateTime,
        },
      },
      "Detailed channel analytics fetched successfully",
    ),
  );
});

//Update channel analytics
const updateChannelAnalytics = async (channelId) => {
  try {
    const video = await Video.aggregate([
      {
        $match: {
          owner: new ObjectId(channelId),
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalVideos: { $sum: 1 },
        },
      },
    ]);
    //get total comment
    const commentCount = await Comment.countDocuments({
      video: { $in: await Video.find({ owner: channelId }).distinct("_id") },
    });
    //get total likes
    const likeCount = await Like.countDocuments({
      video: { $in: await Video.find({ owner: channelId }).distinct("_id") },
    });
    //get total subscribers
    const subscribersCount = await Subscription.countDocuments({
      channel: channelId,
    });

    //prepare data
    const totalView = video[0]?.totalViews || 0;
    const totalVideo = video[0]?.totalVideos || 0;
    //get or create analytics
    let analytics = await ChannelAnalytics.findOne({ channel: channelId });
    //create tody's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    //get yester day's analytics
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    //find yesterday's stats if exists
    const yesterdayStats = analytics?.dailyStats?.find(
      (stat) => new Date(stat.date).toString() === yesterday.toString(),
    );
    //calculate subscribes gained/lost
    const previousSubscribers = yesterdayStats ? analytics : subscribersCount;
    const subscriberGained = Math.max(
      0,
      subscribersCount - previousSubscribers,
    );
    const subscriberLost = Math.max(0, previousSubscribers - subscribersCount);
    //create or update analytics
    if (!analytics) {
      analytics = await ChannelAnalytics.create({
        channel: channelId,
        totalView,
        totalVideos: totalVideo,
        totalSubscribers: subscribersCount,
        totalLikes: likeCount,
        totalComments: commentCount,
        dailyStats: [
          {
            date: today,
            views: totalView,
            subscriberGained,
            likes: likeCount,
            comments: commentCount,
          },
        ],
      });
    } else {
      // Check if today's stats already exist
      const todayStatsIndex = analytics.dailyStats.findIndex(
        (stat) => new Date(stat.date).toDateString() === today.toDateString(),
      );
      if (todayStatsIndex !== -1) {
        // Update today's stats
        analytics.dailyStats[todayStatsIndex] = {
          date: today,
          views: totalView - (yesterdayStats?.views || 0),
          subscriberGained,
          subscriberLost,
          likes: likeCount - (yesterdayStats?.likes || 0),
          comments: commentCount - (yesterdayStats?.comments || 0),
        };
      } else {
        // Add today's stats
        analytics.dailyStats.push({
          date: today,
          views: totalView - (yesterdayStats?.views || 0),
          subscriberGained,
          subscriberLost,
          likes: likeCount - (yesterdayStats?.likes || 0),
          comments: commentCount - (yesterdayStats?.comments || 0),
        });
      }
      //Update the totals
      analytics.totalViews = totalView;
      analytics.totalSubscribers = subscribersCount;
      analytics.totalVideos = totalVideo;
      analytics.totalLikes = likeCount;
      analytics.totalComments = commentCount;

      //Resave
      await analytics.save();
    }
    return analytics;
  } catch (error) {
    console.log("Error updating channel analytics", error);
    return null;
  }
};

module.exports = {
  getChannelAnalyticsOverview,
  getChannelDetailedAnalytics,
  updateChannelAnalytics,
};
