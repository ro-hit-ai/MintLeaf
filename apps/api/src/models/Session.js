const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  expires: {
    type: Date,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for better performance
sessionSchema.index({ userId: 1 });
sessionSchema.index({ sessionToken: 1 });
sessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Session', sessionSchema);