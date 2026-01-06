const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },  
  public: {
    type: Boolean,
    default: false
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reply: {
    type: Boolean,
    default: false
  },
  replyEmail: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['user', 'auto-reply', 'system'],
    default: 'user'
  },
  hash: {
    type: String,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
