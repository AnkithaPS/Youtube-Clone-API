const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      require: [true, "Sender is required"],
      ref: "User",
    },
    type: {
      type: String,
      require: [true, "Notification type is required"],
      enum: ["SUBSCRIPTION", "COMMENT", "REPLY", "VIDEO"],
    },
    content: {
      type: String,
      require: [true, "Content is required"],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
