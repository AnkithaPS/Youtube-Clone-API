const mongoose = require("mongoose");
const config = require("./config");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoURI);
    console.log(`Mongodb Connected:${conn.connection.host}`);
  } catch (error) {
    console.log("Connection Failed");
  }
};

module.exports = connectDB;
