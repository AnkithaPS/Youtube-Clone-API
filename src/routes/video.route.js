const express = require("express");
const { upload } = require("../middlewares/upload.middleware");
const verifyToken = require("../middlewares/auth.middleware");
const {
  getAllVideos,
  getVideoById,
  publishVideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  shareVideo,
} = require("../controllers/video.controller");
const videoRouter = express.Router();

//public route
videoRouter.get("/", getAllVideos);
videoRouter.get("/share/:videoId", shareVideo);

//private route
videoRouter.use(verifyToken);
videoRouter.post(
  "/",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishVideos,
);
videoRouter.get("/:videoId", getVideoById);
videoRouter.patch("/:videoId", upload.single("thumbnail"), updateVideo);
videoRouter.delete("/:videoId", deleteVideo);
videoRouter.patch("/toggle-publish/:videoId", togglePublishStatus);

module.exports = videoRouter;
