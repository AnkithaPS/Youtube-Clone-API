const User = require("../models/user.model");
const Channel = require("../models/channelAnalytics.model");
const Video = require("../models/video.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//Fetch all video details
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  let pipeline = [];

  //Fetch video data based on userId
  if (userId) {
    pipeline.push({ $match: { owner: new ObjectId(userId) } });
  }

  //Fetch data based on query
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      },
    });
  }
  //show published video only
  pipeline.push({ $match: { isPublished: true } });
  //fetch user data
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }],
    },
  });
  //Adding owner data to single field
  pipeline.push({
    $addFields: { owner: { $first: "$owner" } },
  });
  // Sorting the data
  if (sortBy || sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }
  //calculate total videos
  //   const totalResults = await Video.countDocuments(
  //     pipeline.length > 0 ? pipeline.$match : {},
  //   );

  //pagination
  pipeline.push({
    $facet: {
      videos: [
        { $skip: Number(page - 1) * Number(limit) },
        { $limit: Number(limit) },
      ],
      totalCount: [{ $count: "total" }],
    },
  });
  //Aggregate the data
  const videoData = await Video.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: videoData[0].videos,
        totalResults: videoData[0].totalCount[0].total,
        currentPage: Number(page),
        totalPages: Math.ceil(videoData[0].totalCount[0].total / Number(limit)),
      },
      "Videos fetched successfully",
    ),
  );
});

//Get video by ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true },
  ).populate("owner", "username fullName avatar");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  //add to user's watch history
  if (req.user) {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { watchHistory: videoId } },
      { new: true },
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully!"));
});

//Publish a video
const publishVideos = asyncHandler(async (req, res) => {
  const { title, description, tags, category } = req.body;
  if (!title || !description || !category) {
    throw new ApiError(400, "title,description and category is required");
  }
  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail is required");
  }
  const videoLocalPath = req?.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video file and thumbnail is required");
  }
  const videoUpload = await uploadToCloudinary(
    videoLocalPath,
    "youtube/videos",
  );
  if (!videoUpload) {
    throw new ApiError(500, "Error uploading video");
  }
  const thumbnailUpload = await uploadToCloudinary(
    thumbnailLocalPath,
    "youtube/thumbnails",
  );
  if (!thumbnailUpload) {
    await deleteFromCloudinary(videoUpload.public_id, "youtube/videos");
    throw new ApiError(500, "Error uploading thumbnail");
  }
  const video = await Video.create({
    title,
    description,
    category,
    videoFile: {
      public_id: videoUpload.public_id,
      url: videoUpload.secure_url,
    },
    thumbnail: {
      public_id: thumbnailUpload.public_id,
      url: thumbnailUpload.secure_url,
    },
    isPublished: true,
    duration: videoUpload.duration || 0,
    owner: req.user._id,
    tags: tags ? JSON.parse(tags) : [],
  });
  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

//Update video by ID
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, tags, category, isPublished } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findOne({
    _id: new ObjectId(videoId),
    owner: req.user._id,
  });
  if (!video) {
    throw new ApiError(400, "Video not found or you don't have permission ");
  }
  let thumbnailUpdate = {};
  if (req.file) {
    const videoLocalPath = req?.file?.path;
    if (videoLocalPath) {
      //delete old video
      if (video?.thumbnail?.public_id) {
        await deleteFromCloudinary(video?.thumbnail?.public_id);
      }
      //upload new thumbnail
      const thumbnailUpload = await uploadToCloudinary(
        videoLocalPath,
        "youtube/thumbnails",
      );
      if (!thumbnailUpload) {
        throw new ApiError(400, "Error uploading thumbnail");
      }
      thumbnailUpdate = {
        public_id: thumbnailUpload.public_id,
        url: thumbnailUpload.secure_url,
      };
    }
  }
  const updateThumbnail = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title || video.title,
        description: description || video.description,
        tags: tags ? JSON.parse(tags) : video.tags,
        category: category || video.category,
        isPublished:
          isPublished !== undefined ? isPublished : video.isPublished,
        thumbnail: thumbnailUpdate,
      },
    },
    { new: true },
  ).populate("owner", "username fullName avatar");
  return res
    .status(200)
    .json(
      new ApiResponse(200, updateThumbnail, "Thumbnail updated successfully"),
    );
});

//Delete video by ID
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findOne({
    _id: new ObjectId(videoId),
    owner: req.user._id,
  });
  if (!video) {
    throw new ApiError(400, "Video not found or you don't have permission ");
  }
  //delete video from cloudinary
  if (video?.videoFile?.public_id) {
    await deleteFromCloudinary(video?.videoFile?.public_id, "video");
  }

  //delete thumbnail from cloudinary
  if (video?.thumbnail?.public_id) {
    await deleteFromCloudinary(video?.thumbnail?.public_id, "video");
  }
  await Video.findByIdAndDelete(videoId);
  res.status(200).json(new ApiResponse(200, "Video deleted successfully"));
});

//Toggle published video status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findOne({
    _id: new ObjectId(videoId),
    owner: req.user._id,
  });
  if (!video) {
    throw new ApiError(400, "Video not found or you don't have permission ");
  }
  //toggle publish status
  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { isPublished: !video.isPublished } },
    { new: true },
  ).populate("owner", "username fullName avatar");
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateVideo,
        `Video ${updateVideo.isPublished ? "published" : "unpublished"} successfully`,
      ),
    );
});

//Generate share link for video
const shareVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { platform = "general" } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found or you don't have permission ");
  }
  //generate share link
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const videoUrl = `${baseUrl}/api/v1/video/${videoId}`;

  //generate platform specific share link
  let shareLinks = {
    direct: videoUrl,
    Clipboard: videoUrl,
  };
  console.log(platform);
  switch (platform.toLowerCase()) {
    case "facebook":
      shareLinks.facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`;
      break;

    case "twitter":
      shareLinks.twitter = `https://www.twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`;
      break;

    case "whatsapp":
      shareLinks.whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(video.title + " " + videoUrl)}&text=${encodeURIComponent(video.title)}`;
      break;

    case "linkedin":
      shareLinks.linkedin = `https://www.linkedin.com/sharing/share-offsite?url=${encodeURIComponent(videoUrl)}`;
      break;

    case "telegram":
      shareLinks.telegram = `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`;
      break;

    case "reddit":
      shareLinks.reddit = `https://reddit.com/submit?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(video.title)}`;
      break;

    default:
      //for general
      shareLinks = {
        ...shareLinks,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
        twitter: `https://www.twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(video.title + " " + videoUrl)}&text=${encodeURIComponent(video.title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite?url=${encodeURIComponent(videoUrl)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(video.title)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(video.title)}`,
      };
  }
  await Video.findByIdAndUpdate(videoId, { $inc: { shares: 1 } });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videoId,
        videoTitle: video.title,
        thumbnail: video.thumbnail,
        shareLinks,
      },
      "Video link shared successfully!",
    ),
  );
});

module.exports = {
  getAllVideos,
  getVideoById,
  publishVideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  shareVideo,
};
