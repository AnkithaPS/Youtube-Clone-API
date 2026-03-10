const mongoose = require("mongoose");
const mongooseAggregatePaginate = require("mongoose-aggregate-paginate-v2");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Play;ist is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;
