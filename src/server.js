const express = require("express");
const config = require("./config/config");
const userRouter = require("./routes/user.route");
const connectDB = require("./config/connectDB");
const app = express();

//Connect to mongodb
connectDB();

//Routes
app.use("/api/v1/user", userRouter);

//Run server
let PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});
