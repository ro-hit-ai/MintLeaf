const mongoose = require('mongoose');

const timeTrackingSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number,
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('TimeTracking', timeTrackingSchema);
