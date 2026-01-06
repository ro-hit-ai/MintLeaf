const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.external_user; // Password not required for external users
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isAgent: {
    type: Boolean,
    default: false // New field for agents
  },
  language: {
    type: String,
    default: 'en'
  },
  external_user: {
    type: Boolean,
    default: false
  },
  firstLogin: {
    type: Boolean,
    default: true
  },
  // Notification preferences
  notify_ticket_created: {
    type: Boolean,
    default: true
  },
  notify_ticket_status_changed: {
    type: Boolean,
    default: true
  },
  notify_ticket_comments: {
    type: Boolean,
    default: true
  },
  notify_ticket_assigned: {
    type: Boolean,
    default: true
  },
  permissions:{
    type: [String], // e.g. ["ticket::create", "issue::read"]
    default: []
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);