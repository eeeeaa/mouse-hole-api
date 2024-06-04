const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String },
  images: [{ type: String }],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", PostSchema);
