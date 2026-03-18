const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const likeSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  { timestamps: true },
);
//Ensure that like must refer to either video or comment but not both
likeSchema.pre("save", function (next) {
  if (!this.video && !this.comment) {
    const error = new Error("like must refer to either video or comment");
    return next(error);
  }
  if (this.video && this.comment) {
    const error = new Error(
      "like must refer to either video or comment but not both",
    );
    return next(error);
  }
  return;
});

//compound index to ensure user can only like video or comment only once
likeSchema.index(
  { video: 1, likedBy: 1 },
  {
    unique: true,
    partialFilterExpression: { video: { $exists: true, $ne: null } },
    spare: true,
  },
); //spare=>include document only if both field present
likeSchema.index(
  { comment: 1, likedBy: 1 },
  {
    unique: true,
    partialFilterExpression: { comment: { $exists: true, $ne: null } },
    spare: true,
  },
); //spare=>include document only if both field present

const Like = mongoose.model("Like", likeSchema);
module.exports = Like;
