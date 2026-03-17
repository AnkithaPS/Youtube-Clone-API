const express = require("express");
const config = require("./config/config");
const userRouter = require("./routes/user.route");
const channelRouter = require("./routes/channel.route");
const videoRouter = require("./routes/video.route");
const playlistRouter = require("./routes/playlist.route");
const notificationRouter = require("./routes/notification.route");
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
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/playlist", playlistRouter);
//Error handler
app.use(notFound);
app.use(errorHandler);

//Run server
let PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});
