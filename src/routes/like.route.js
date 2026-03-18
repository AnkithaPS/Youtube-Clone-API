const express = require("express");
const verifyToken = require("../middlewares/auth.middleware");
const {
  toggleLikeVideo,
  toggleLikeComment,
  getLikedVideo,
  getVideoLikes,
  getCommentLikes,
} = require("../controllers/like.controller");
const likeRouter = express.Router();

likeRouter.post("/toggle/video/:videoId", verifyToken, toggleLikeVideo);
likeRouter.post("/toggle/comment/:commentId", verifyToken, toggleLikeComment);
likeRouter.get("/videos", verifyToken, getLikedVideo);
likeRouter.get("/videos/:videoId", verifyToken, getVideoLikes);
likeRouter.get("/comment/:commentId", verifyToken, getCommentLikes);

module.exports = likeRouter;
