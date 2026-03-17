const express = require("express");
const { upload } = require("../middlewares/upload.middleware");
const verifyToken = require("../middlewares/auth.middleware");
const {
  createPlaylist,
  addVideoToPlaylistBy,
  getPlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
} = require("../controllers/playlist.controller");
const playlistRouter = express.Router();

//public route
playlistRouter.get("/:playlistId", getPlaylistById);

//private route
playlistRouter.use(verifyToken);
playlistRouter.post("/", createPlaylist);
playlistRouter.get("/user/:userId", getPlaylist);
playlistRouter.patch("/:playlistId", updatePlaylist);
playlistRouter.delete("/:playlistId", deletePlaylist);
playlistRouter.patch("/:playlistId/add/:videoId", addVideoToPlaylistBy);
playlistRouter.patch("/:playlistId/remove/:videoId", removeVideoFromPlaylist);

module.exports = playlistRouter;
