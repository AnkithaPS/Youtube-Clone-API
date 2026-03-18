const User = require("../models/user.model");
const Video = require("../models/video.model");
const Comment = require("../models/comment.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  createNotification,
} = require("../controllers/notification.controller");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//Fetch all comments on video
const getVideoComment = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, {}, message));
});

//Add new comment to video
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { content, parentCommentId } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }
  const commentData = {
    content,
    video: videoId,
    owner: req.user._id,
  };
  //check is parent comment exists
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      throw new ApiError(404, "Parent comment not found");
    }
    commentData.parentComment = parentCommentId;
  }
  const comment = await Comment.create(commentData);
  //fetch populated comment
  const populatedComment = await Comment.findById(comment._id).populate(
    "owner",
    "username fullName avatar",
  );
  //send notification
  if (parentCommentId) {
    //reply notification
    const parentComment = await Comment.findById(parentCommentId);
    if (
      parentComment &&
      parentComment.owner.toString() !== req.user._id.toString()
    ) {
      await createNotification(
        parentComment.owner,
        req.user._id,
        `${req.user.fullName} replied to your comment`,
        "REPLY",
      );
    }
  } else {
    //new comment notification on video
    const video = await Video.findById(videoId);
    if (video && video.owner.toString() !== req.user._id.toString()) {
      await createNotification(
        video.owner,
        req.user._id,
        `${req.user.fullName} commented on your comment`,
        "COMMENT",
      );
    }
  }
  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

//Update an existing comment
const updateComment = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideo, totalLikedVideo: likedVideo.length },
        "Liked video fetched successfully",
      ),
    );
});

//Delete comment
const deleteComment = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedUsers, totalLikedUsers: likedUsers.length },
        "Liked users fetched successfully",
      ),
    );
});

//Fetch all reply on comment
const getAllReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedUsers, totalLikedUsers: likedUsers.length },
        "Liked users fetched successfully",
      ),
    );
});

module.exports = {
  getVideoComment,
  addComment,
  updateComment,
  deleteComment,
  getAllReply,
};
