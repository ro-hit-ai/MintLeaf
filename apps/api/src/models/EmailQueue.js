const mongoose = require('mongoose');

const EmailQueueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
  serviceType: {
    type: String,
    required: true,
    enum: ['gmail', 'outlook', 'custom'],
    default: 'custom'
  },
  username: { type: String, required: true, trim: true },
  password: {
    type: String,
    required: function () { return this.serviceType === 'custom'; },
    default: null
  },
hostname: {
  type: String,
  required: function () {
    return this.serviceType === 'custom';
  },
  default: function () {
    if (this.serviceType === 'gmail') return 'imap.gmail.com';
    if (this.serviceType === 'outlook') return 'outlook.office365.com';
    return null;
  },
  trim: true,
},

  imapPort: { type: Number, default: 993 },
  smtpPort: { type: Number, default: 465 },
  tls: { type: Boolean, default: true },
  replyAddress: {
    type: String,
    default: function () { return this.username; }
  },
  clientId: { type: String, default: null },
  clientSecret: { type: String, default: null },
  redirectUri: { type: String, default: null },
  accessToken: { type: String, default: null },
  refreshToken: { type: String, default: null },
  tokenExpiry: { type: Date, default: null },
  folder: { type: String, default: 'INBOX' },
  scanInterval: { type: Number, default: 5 },
  lastScanned: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  // NEW: Priority for queue selection
  priority: { type: Number, default: 0 }, // Higher number = higher priority
  // NEW: Rate limiting for sending/receiving
  maxEmailsPerHour: { type: Number, default: 100 },
  // NEW: Health status tracking
  healthStatus: {
    type: String,
    enum: ['healthy', 'degraded', 'failed'],
    default: 'healthy'
  },
  lastError: { type: String, default: null },
  lastErrorTime: { type: Date, default: null }
}, { timestamps: true });

// Indexes
EmailQueueSchema.index({ active: 1, serviceType: 1, priority: -1 });
EmailQueueSchema.index({ createdBy: 1 });
EmailQueueSchema.index({ isDeleted: 1 });
EmailQueueSchema.index({ healthStatus: 1 }); // NEW: Index for health monitoring

// Virtual for checking token expiry
EmailQueueSchema.virtual('isTokenExpired').get(function () {
  if (!['gmail', 'outlook'].includes(this.serviceType) || !this.tokenExpiry) return false;
  return this.tokenExpiry < new Date();
});

// Validate configuration
EmailQueueSchema.methods.validateConfig = function () {
  if (this.serviceType === 'custom' && !this.password) {
    throw new Error('Password is required for custom SMTP/IMAP services');
  }
  if (['gmail', 'outlook'].includes(this.serviceType) && (!this.accessToken || !this.refreshToken)) {
    throw new Error('OAuth2 tokens are required for Gmail/Outlook service');
  }
  return true;
};

// NEW: Update health status
EmailQueueSchema.methods.updateHealth = async function (status, error = null) {
  this.healthStatus = status;
  this.lastError = error ? error.message : null;
  this.lastErrorTime = error ? new Date() : null;
  await this.save();
};

// Static methods
EmailQueueSchema.statics.findActiveQueues = function () {
  return this.find({ active: true, isDeleted: false }).sort({ priority: -1 });
};

EmailQueueSchema.statics.findByServiceType = function (serviceType) {
  return this.find({ serviceType, active: true, isDeleted: false }).sort({ priority: -1 });
};

module.exports = mongoose.model('EmailQueue', EmailQueueSchema);