const multer = require("multer");
const path = require("path");
const apiError = require("../utils/ApiError");

//configure storage
const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, res, cb) {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "_" + uniqueSuffix + ext);
  },
});

//File filter
const fileFilter = (req, file, cb) => {
  //accepts video and images
  if (
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(new apiError(400, "Only video and images are allowed"));
  }
};

//Exports multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSizes: 100 * 1024 * 1024 }, //100MB
});
module.exports = { upload };
