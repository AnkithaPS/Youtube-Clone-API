const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

//add compound index to ensure user can only subscribe a channel once
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });
const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
