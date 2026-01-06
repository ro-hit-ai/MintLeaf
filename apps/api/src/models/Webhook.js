const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  active: { type: Boolean, default: true },
  secret: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

// Check if model already exists, otherwise create it
module.exports = mongoose.models.Webhook || mongoose.model('Webhook', webhookSchema);
