const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true
  },
   subject: {
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
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);