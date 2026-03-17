const express = require("express");
const verifyToken = require("../middlewares/auth.middleware");
const {
  getUserNotification,
  markNotificationAsRead,
  markAllNotificationAsRead,
  deleteNotification,
} = require("../controllers/notification.controller");
const notificationRouter = express.Router();

//Private routes
notificationRouter.use(verifyToken);
notificationRouter.get("/", getUserNotification);
notificationRouter.patch("/mark-all-read", markAllNotificationAsRead);
notificationRouter.patch("/:notificationId", markNotificationAsRead);
notificationRouter.delete("/:notificationId", deleteNotification);

module.exports = notificationRouter;
