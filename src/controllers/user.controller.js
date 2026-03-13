const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const config = require("../config/config");

//AccessToken and refresh token generation
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = generateAccessToken(
      user._id,
      user.email,
      user.username,
    );
    const refreshToken = generateRefreshToken(userId);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error, "Error generating tokens");
  }
};
//Register new User
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "username,email,fullName and password is required");
  }
  //check user exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  let avatarUpload, coverUpload;
  if (req.files && req.files.avatar && req.files.avatar[0]?.path) {
    const avatarResult = await uploadToCloudinary(
      req.files.avatar[0].path,
      "youtube/avatars",
    );
    if (!avatarResult) {
      throw new ApiError(500, "Error uploading avatar");
    }
    avatarUpload = {
      public_id: avatarResult.public_id,
      url: avatarResult.secure_url,
    };
  }
  if (req.files && req.files.coverImage && req.files.coverImage[0]?.path) {
    const coverResult = await uploadToCloudinary(
      req.files.coverImage[0].path,
      "youtube/cover-image",
    );
    if (!coverResult) {
      throw new ApiError(500, "Error uploading cover image");
    }
    coverUpload = {
      public_id: coverResult.public_id,
      url: coverResult.secure_url,
    };
  }
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    avatar: Object.keys(avatarUpload).length > 0 ? avatarUpload : undefined,
    coverImage: Object.keys(coverUpload).length > 0 ? coverUpload : undefined,
    password,
  });
  //remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new Error("Error registering user");
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registered successfully"));
});

//Login user and create token
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "email and username required");
  }
  if (!password) {
    throw new ApiError(400, "password is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username: username }],
  });
  if (!user) {
    throw new ApiError(400, "User not found!");
  }
  //check if password is correct

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credential");
  }
  //Generate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  //set cookies
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict", //CSRF protected
    secure: config.nodeEnv === "production",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
});

//logout user and clear token
const logoutUser = asyncHandler(async (req, res) => {
  //clear refresh token in database
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true },
  );
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict", //CSRF protected
    secure: config.nodeEnv === "production",
    path: "/",
    expires: new Date(0),
  };
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//Refresh access token using refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req?.cookies?.refreshToken || req?.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  //verify refresh token
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    config.refreshTokenSecret,
  );

  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token!");
  }
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired");
  }
  //generate access token
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user._id);

  //cookie setup
  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict",
    secure: config.nodeEnv === "production",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "User logged in successfully",
      ),
    );
});
//Change user password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password required");
  }
  const user = await User.findById(req.user._id);
  //check old password valid or not
  const isVerified = user.isPasswordCorrect(oldPassword);
  if (!isVerified) {
    throw new ApiError(400, "Invalid old password !");
  }
  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

//Fetch user profile
const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Current user profile"));
});

//Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "fullName or email is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        email: email || user.req.email,
      },
    },
    { new: true },
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

//Update user avatar
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file && !req.file?.path) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.findById(req.user._id);
  //delete old avatar from cloudinary
  if (user?.avatar) {
    await deleteFromCloudinary(user?.avatar?.public_id, "image");
  }
  //upload new avatar
  const result = await uploadToCloudinary(req?.file?.path, "youtube/avatars");
  if (!result) {
    throw new ApiError(400, "Error uploading avatar");
  }
  const updateAvatar = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: { public_id: result.public_id, url: result.secure_url } },
    },
    { new: true },
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(
      new ApiResponse(200, { updateAvatar }, "Avatar updated successfully"),
    );
});

//Update user cover image
const updateCoverImage = asyncHandler(async (req, res) => {
  if (!req.file && !req.file?.path) {
    throw new ApiError(400, "CoverImage file is required");
  }
  const user = await User.findById(req.user._id);
  //delete old avatar from cloudinary
  if (user?.avatar) {
    await deleteFromCloudinary(user?.coverImage?.public_id, "image");
  }
  //upload new avatar
  const result = await uploadToCloudinary(
    req?.file?.path,
    "youtube/cover-image",
  );
  if (!result) {
    throw new ApiError(400, "Error uploading coverImage");
  }
  const updateAvatar = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: { public_id: result.public_id, url: result.secure_url },
      },
    },
    { new: true },
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updateAvatar },
        "Cover image updated successfully",
      ),
    );
});

//Fetch current user's channel profile with subscription
const getUserChannelProfile = asyncHandler(async (req, res) => {});

//Fetch user's watch history
const getWatchHistory = asyncHandler(async (req, res) => {});

//Request password reset email
const requestPasswordReset = asyncHandler(async (req, res) => {});

//Reset password using reset token
const resetPassword = asyncHandler(async (req, res) => {});

module.exports = {
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
};
