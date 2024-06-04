const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  display_name: { type: String },
  profile_url: { type: String },
  github_id: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
