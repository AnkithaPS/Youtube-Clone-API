const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      require: [true, "Comment  content is required"],
      trim: true,
      index: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      require: [true, "Video is required"],
      ref: "Video",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      require: [true, "Owner is required"],
      ref: "User",
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  },
  { timestamps: true },
);
//pagination plugin
commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
