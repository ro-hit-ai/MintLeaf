// apps/api/models/Ticket.js
const mongoose = require('mongoose');
const Counter = require('./Counter');

const ticketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true, unique: true, sparse: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    // ✅ UPDATED PRIORITY FIELD - Added 'pending'
    priority: { 
      type: String, 
      enum: ['pending', 'low', 'medium', 'high', 'critical'], // Added 'pending'
      default: 'medium' 
    },
    email: { type: String, required: true },
    type: { type: String, default: 'support' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    clientName: { type: String, trim: true, default: null },
    fromImap: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isComplete: { type: Boolean, default: false },
    status: { type: String, default: 'open' },
    originalMessageId: { 
           type: String,
           default: null,
           index: true
    },
    note: String,
    hidden: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // ✅ ADD THESE NEW FIELDS for Python integration
    priority_updated_at: { 
      type: Date 
    },
    sentiment_analyzed: { 
      type: Boolean, 
      default: false 
    },
    emailId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'EmailMessage',
      default: null 
    }
  },
  { timestamps: true }
);

// Add indexes for efficient queries
ticketSchema.index({ priority: 1, sentiment_analyzed: 1 });
ticketSchema.index({ email: 1, title: 1 });

ticketSchema.pre('validate', async function(next) {
  if (!this.number) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'ticket' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.number = `TKT-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);