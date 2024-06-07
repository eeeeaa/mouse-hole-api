const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserRelationshipSchema = new Schema({
  user_id_first: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user_id_second: { type: Schema.Types.ObjectId, ref: "User", required: true },
  relation_type: {
    type: String,
    enum: ["Follow"],
    default: "Follow",
  },
});

module.exports = mongoose.model("UserRelationship", UserRelationshipSchema);
