require("dotenv").config();
const config = {
  mongoURI: process.env.MONGODB_URI || "mongodb://localhost:27017/youtube",
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudApiKey: process.env.CLOUDINARY_API_KEY,
    cloudApiSecret: process.env.CLOUD_API_SECRET,
  },
  corsOrigin: process.env.CORS_ORIGIN,
};

module.exports = config;
