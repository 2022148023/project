const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WikiScheme = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  trash_type: [
    {
      type: String,
    },
  ],
  details: {
    type: String,
  },
  image: {
    type: String,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = Wiki = mongoose.model("Wiki", WikiScheme);
