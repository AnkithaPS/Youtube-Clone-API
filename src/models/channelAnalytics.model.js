const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const channelAnalyticsSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    totalView: {
      type: Number,
      default: 0,
    },
    totalSubscribers: {
      type: Number,
      default: 0,
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },

    totalComments: {
      type: Number,
      default: 0,
    },
    dailyStats: [
      {
        date: {
          type: Date,
          require: true,
        },
        views: {
          type: Number,
          default: 0,
        },
        subscribersGained: {
          type: Number,
          default: 0,
        },
        subscribersLost: {
          type: Number,
          default: 0,
        },
        likes: {
          type: Number,
          default: 0,
        },
        comments: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true },
);

//index for faster lookup
channelAnalyticsSchema.index({ channel: 1 });

const ChannelAnalytics = mongoose.model(
  "ChannelAnalytic",
  channelAnalyticsSchema,
);
module.exports = ChannelAnalytics;
