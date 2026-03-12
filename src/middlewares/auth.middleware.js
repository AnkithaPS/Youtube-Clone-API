const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const verify = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req?.cookies?.accessToken || req?.headers?.Authorization?.split(" ")?.[1];
    if (!token) {
      throw new ApiError(401, "Unauthorized User!");
    }
    //decode the access token
    const decodedToken = jwt.verify(token, config.accessTokenSecret);
    //check user in database
    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken",
    );
    if (!user) {
      throw new ApiError(401, "Unauthorized User!");
    }
    req.user = user;
    next();
  } catch (error) {
    //special handling for logout
    if (req.path === "/logout") {
      const cookieOptions = {
        httpOnly: true,
        sameSite: "strict", //CSRF protected
        secure: config.nodeEnv === "production",
        path: "/",
        expires: new Date(0),
      };
      res
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions);
      return res
        .status(200)
        .json({ success: true, message: "Logout successfully", data: {} });
    }

    throw new ApiError(400, "Invalid tokens");
  }
});

module.exports = verify;
