const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WikiScheme = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = Wiki = mongoose.model("Wiki", WikiScheme);
