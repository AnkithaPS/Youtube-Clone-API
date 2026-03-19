const express = require("express");
const { upload } = require("../middlewares/upload.middleware");
const verifyToken = require("../middlewares/auth.middleware");
const {
  getChannelInfo,
  updateChannelInfo,
  updateNotificationSettings,
  getChannelVideos,
  getChannelShareLink,
} = require("../controllers/channel.controller");
const {
  getChannelAnalyticsOverview,
  getChannelDetailedAnalytics,
  updateChannelAnalytics,
} = require("../controllers/channelAnalytics.controller");
const channelRouter = express.Router();

//Public route
channelRouter.get("/:username", getChannelInfo);
channelRouter.get("/:username/videos", getChannelVideos);
channelRouter.get("/:username/share", getChannelShareLink);

//private(protected) route
channelRouter.use(verifyToken);
channelRouter.patch(
  "/update",
  upload.fields([{ name: "coverImage", maxCount: 1 }]),
  updateChannelInfo,
);
channelRouter.patch("/notification-settings", updateNotificationSettings);
//Analytics overview
channelRouter.get(
  "/analytics/overview/:channelId",
  verifyToken,
  getChannelAnalyticsOverview,
);
channelRouter.get("/analytics/detail/:channelId", getChannelDetailedAnalytics);
channelRouter.patch("/:channelId", updateChannelAnalytics);
module.exports = channelRouter;
