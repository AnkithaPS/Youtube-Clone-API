const ApiError = require("../utils/ApiError");
const config = require("../config/config");

//Error middleware
const errorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error?.statusCode || error?.status || 500;
    const message = error?.message || "Something went wrong!";
    error = new ApiError(
      statusCode,
      message,
      error?.errors || [],
      error?.stack,
    );
  }
  //final response
  const response = {
    success: false,
    message: error?.message,
    errors: error?.errors,
    stack: config.nodeEnv !== "production" ? error?.stack : undefined,
  };
  //send response
  return res.status(error?.statusCode || 500).json(response);
};

//not found error
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not Found!- ${req.originalUrl}`);
  next(error);
};

module.exports = { errorHandler, notFound };
