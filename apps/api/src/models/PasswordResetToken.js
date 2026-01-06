const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour expiration
    index: { expireAfterSeconds: 0 } // TTL index
  }
}, {
  timestamps: true
});

// Index for better performance
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ code: 1 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);