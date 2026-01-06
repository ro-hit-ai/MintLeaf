const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  host: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  secure: {
    type: Boolean,
    default: false
  },
  user: {
    type: String,
    required: true
  },
  pass: {
    type: String,
    required: true
  },
  reply: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Email', emailSchema);