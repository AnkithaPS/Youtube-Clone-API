const jwt = require("jsonwebtoken");
const config = require("../config/config");

//Generate access token
const generateAccessToken = (id, email, username) => {
  return jwt.sign({ id, email, username }, config.accessTokenSecret, {
    expiresIn: config.accessTokenExpiry,
  });
};

//generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiry,
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
