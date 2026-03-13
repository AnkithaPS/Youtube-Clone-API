const express = require("express");
const config = require("./config/config");
const userRouter = require("./routes/user.route");
const channelRouter = require("./routes/channel.route");
const videoRouter = require("./routes/video.route");
const connectDB = require("./config/connectDB");
const cookieParser = require("cookie-parser");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const app = express();

//Connect to mongodb
connectDB();
//Middleware
app.use(cookieParser());
app.use(express.json());

//Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/channel", channelRouter);
app.use("/api/v1/video", videoRouter);

//Error handler
app.use(notFound);
app.use(errorHandler);

//Run server
let PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});
