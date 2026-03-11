const cloudinary = require("cloudinary").v2;
const config = require("../config/config");
//cloudinary configuration
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.cloudApiKey,
  api_secret: config.cloudinary.cloudApiSecret,
});

//Function to media to cloudinary
const uploadToCloudinary = async (filePath, folder) => {
  try {
    console.log("here", filePath);
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.log("Error uploading media to cloudinary", error);
    throw new Error("Failed to upload media to cloudinary");
  }
};

//Function to media to cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.log("Failed to delete media from cloudinary");
    throw new Error("Failed to delete media from cloudinary");
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
