const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserScheme = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
    required: true,
  },
  registration_date: {
    type: Date,
    default: Date.now,
  },
  wikis: [
    {
      type: Schema.Types.ObjectId,
      ref: "Wiki",
    },
  ],
});

module.exports = User = mongoose.model("User", UserScheme);
