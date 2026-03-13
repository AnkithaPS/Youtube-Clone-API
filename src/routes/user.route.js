const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/user.controller");
const { upload } = require("../middlewares/upload.middleware");
const userRouter = express.Router();
const verifyToken = require("../middlewares/auth.middleware");

//public route
userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.post("/request-password-reset", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);

//Private routes
userRouter.use(verifyToken);
userRouter.post("/logout", logoutUser);
userRouter.get("/profile", getUserProfile);
userRouter.patch("/change-password", changePassword);
userRouter.patch("/update/profile", updateUserProfile);
userRouter.patch("/avatar", upload.single("avatar"), updateAvatar);
userRouter.patch("/cover-image", upload.single("coverImage"), updateCoverImage);
//Channel route
userRouter.get("/c/:username", getUserChannelProfile);
userRouter.get("/history", getWatchHistory);

module.exports = userRouter;
