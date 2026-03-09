const express = require("express");
const config = require("./config/config");
const connectDB = require("./config/connectDB");
const app = express();

//Connect to mongodb
connectDB();

//Run server
let PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});
