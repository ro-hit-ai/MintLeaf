// models/ImapEmail.js
const mongoose = require("mongoose");

const ImapEmailSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      default: "No Subject",
    },
    body: {
      type: String,
      default: "No Body",
    },
    html: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("ImapEmail", ImapEmailSchema);
