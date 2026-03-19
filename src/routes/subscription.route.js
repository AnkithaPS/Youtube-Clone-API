const express = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const {
  toggleSubscription,
  getChannelSubscribers,
  getUserSubscribedChannels,
} = require("../controllers/subscription.controller");

const subscriptionRouter = express.Router();
//Toggle subscription (subscribe/unsubscribe)
subscriptionRouter.post("/toggle/:channelId", verifyJWT, toggleSubscription);

// Get user's subscribed channels
subscriptionRouter.get(
  "/user/channels/:subscriberId",
  verifyJWT,
  getUserSubscribedChannels,
);

// Get channel subscribers
subscriptionRouter.get(
  "/channel/subscribers/:channelId",
  verifyJWT,
  getChannelSubscribers,
);

module.exports = subscriptionRouter;
