const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentRelationshipSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  relation_type: {
    type: String,
    enum: ["like"],
    default: "like",
  },
});

module.exports = mongoose.model(
  "CommentRelationship",
  CommentRelationshipSchema
);
