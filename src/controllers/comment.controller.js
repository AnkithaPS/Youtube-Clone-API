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
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  const comment = await Comment.aggregate([
    {
      $match: {
        video: new ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
      $lookup: {
        from: "comments",
        localField: "parentComment",
        foreignField: "_id",
        as: "replies",
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
        owner: { $first: "$owner" },
        repliesCount: { $size: "$replies" },
      },
    },
    {
      $sort: { createdAt: 1 },
    },
    {
      $skip: parseInt(page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ]);
  const totalComment = await Comment.countDocuments({
    video: new ObjectId(videoId),
    parentComment: null,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comment,
        totalComment,
        currentPage: page,
        totalPage: Math.ceil(totalComment / parseInt(limit)),
      },
      "Comments fetched successfully",
    ),
  );
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
  const { commentId } = req.params;
  const { content } = req.body;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you don't have permission to update comment",
    );
  }
  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

//Delete comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you don't have permission to delete comment",
    );
  }
  await Comment.deleteMany({
    $or: [{ _id: new ObjectId(commentId) }, { parentComment: commentId }],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, " comment deleted successfully"));
});

//Fetch all reply on comment
const getAllReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  const replies = await Comment.aggregate([
    {
      $match: {
        parentComment: new ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
      $addFields: { owner: { $first: "$owner" } },
    },
    { $sort: { createdAt: -1 } },
    {
      $skip: parseInt(page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
  ]);
  const totalReplies = await Comment.countDocuments({
    parentComment: new ObjectId(commentId),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        replies,
        totalReplies,
        currentPage: page,
        totalPage: Math.ceil(totalReplies) / parseInt(limit),
      },
      "All replies fetched successfully",
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
