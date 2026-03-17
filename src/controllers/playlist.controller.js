const User = require("../models/user.model");
const Channel = require("../models/channelAnalytics.model");
const Video = require("../models/video.model");
const Playlist = require("../models/playlist.mode");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//Create playlist
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, isPublic = true } = req.body;
  if (!name || name.trim() === "") {
    throw new ApiError(400, "Playlist name is required");
  }
  const playlist = await Playlist.create({
    name,
    description: description || "",
    owner: req.user._id,
    isPublic: Boolean(isPublic),
  });
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

//Add video to playlist
const addVideoToPlaylistBy = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist and Video Id is required");
  }
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(400, "Playlist not found or you don't have permission");
  }
  //check if playlist has video
  if (playlist?.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in playlist");
  }
  //add video to playlist
  playlist.videos.push(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video Added to playlist successfully!"),
    );
});

//Fetch playlist with video information
const getPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userProfile = await User.findById(userId);
  const user = userProfile ? userId : req.user._id;

  if (!user) {
    throw new ApiError(400, "User Id is required");
  }
  const isOwner = req.user._id.toString() === user.toString();
  const filter = {
    owner: new ObjectId(user),
    ...(isOwner ? {} : { isPublic: true }),
  };
  console.log(filter);

  const playlist = await Playlist.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              thumbnail: 1,
              videoFile: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: { videoCount: { $size: "$video" } },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

//Fetch single playlist details
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Playlist Id is required");
  }
  const playlist = await Playlist.aggregate([
    { $match: { _id: new ObjectId(playlistId) } },
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
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        videoCount: { $size: "$videos" },
      },
    },
  ]);
  if (playlist.length <= 0) {
    throw new ApiError(404, "Playlist Not found");
  }
  const playlistData = playlist[0];
  //check if playlist is private and user is not the owner
  if (
    !playlistData.isPublic &&
    (!req.user || playlistData._id.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(403, "You don't have permission to view this playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

//remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {});

//update playlist
const updatePlaylist = asyncHandler(async (req, res) => {});

//delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {});

module.exports = {
  createPlaylist,
  addVideoToPlaylistBy,
  getPlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
};
