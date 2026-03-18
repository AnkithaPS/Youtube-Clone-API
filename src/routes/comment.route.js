const express = require("express");
const verifyToken = require("../middlewares/auth.middleware");
const {
  getVideoComment,
  addComment,
  updateComment,
  deleteComment,
  getAllReply,
} = require("../controllers/comment.controller");
const commentRouter = express.Router();

commentRouter.get("/video/:videoId", getVideoComment);
commentRouter.post("/video/:videoId", verifyToken, addComment);
commentRouter.patch("/:commentId", verifyToken, updateComment);
commentRouter.delete("/:commentId", verifyToken, deleteComment);
commentRouter.get("/:commentId/replies", getAllReply);

module.exports = commentRouter;
