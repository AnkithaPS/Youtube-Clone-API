const User = require("../models/user.model");
const Video = require("../models/video.model");
const Like = require("../models/like.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//toggle like/unlike video
const toggleLikeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  const like = await Like.findOne({
    video: new Object(videoId),
    likedBy: req.user._id,
  });
  let message, newLike;
  if (like) {
    //Unlike
    await Like.findByIdAndDelete(like._id);
    message = "Video unliked successfully";
    // unlikes on video
    await Video.findByIdAndUpdate(videoId, { $inc: { likes: -1 } });
  } else {
    //like
    newLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    message = "Video liked successfully";
    //update likes on video
    await Video.findByIdAndUpdate(videoId, { $inc: { likes: 1 } });
  }

  return res.status(201).json(new ApiResponse(201, {}, message));
});

//toggle like/unlike comment
const toggleLikeComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }
  const like = await Like.findOne({
    comment: new Object(commentId),
    likedBy: req.user._id,
  });
  let message, newLike;
  if (like) {
    await Like.findByIdAndDelete(like._id);
    message = "Comment unliked successfully";
  } else {
    newLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    message = "Comment liked successfully";
  }
  return res.status(201).json(new ApiResponse(201, {}, message));
});

//Fetch all video's liked by authenticated user
const getLikedVideo = asyncHandler(async (req, res) => {
  const likedVideo = await Like.aggregate([
    {
      $match: {
        likedBy: new ObjectId(req.user._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
        ],
      },
    },
    {
      $addFields: { video: { $first: "$video" } },
    },
  ]);
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

//Fetch all users who liked specific video
const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  const likedUsers = await Like.aggregate([
    {
      $match: {
        video: new ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedBy",
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
      $addFields: { likedBy: { $first: "$likedBy" } },
    },
  ]);
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

//Fetch all users who liked specific comment
const getCommentLikes = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }
  const likedUsers = await Like.aggregate([
    {
      $match: {
        comment: new ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "likedBy",
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
      $addFields: { likedBy: { $first: "$likedBy" } },
    },
  ]);
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
  toggleLikeVideo,
  toggleLikeComment,
  getLikedVideo,
  getVideoLikes,
  getCommentLikes,
};
