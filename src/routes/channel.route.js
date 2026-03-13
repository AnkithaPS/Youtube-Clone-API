const express = require("express");
const { upload } = require("../middlewares/upload.middleware");
const verifyToken = require("../middlewares/auth.middleware");
const {
  getChannelInfo,
  updateChannelInfo,
  updateNotificationSettings,
  getChannelVideo,
  getChannelShareLink,
} = require("../controllers/channel.controller");
const channelRouter = express.Router();

//Public route
channelRouter.get("/:username", getChannelInfo);
channelRouter.get("/:username/videos", getChannelVideo);
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
module.exports = channelRouter;
