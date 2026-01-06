const mongoose = require("mongoose");

const EmailMessageSchema = new mongoose.Schema({
  mailbox: { type: mongoose.Schema.Types.ObjectId, ref: "EmailQueue", required: true },
  messageId: { type: String, index: true }, // IMAP UID or Gmail messageId
  folder: {
     type: String,
     enum: ["inbox", "sent", "received", "drafts", "trash", "resolved", "internal","processed"],
     default: "inbox"
  },
  subject: String,
  body: String,
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  date: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  attachments: [
    {
      filename: String,
      contentType: String,
      size: Number,
      url: String, // if stored in S3/GridFS
    }
  ],
  // ✅ NEW PRIORITY FIELDS - PERFECT!
  priority: { 
    type: String, 
    enum: ["pending", "low", "medium", "high"], 
    default: "pending" 
  },
  priority_updated_at: { 
    type: Date 
  },
  sentiment_analyzed: { 
    type: Boolean, 
    default: false 
  },
  // ✅ ADD THIS: Link to ticket
  ticketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket',
    default: null 
  }
}, { timestamps: true });

// Add index for efficient priority queries
EmailMessageSchema.index({ priority: 1, sentiment_analyzed: 1 });
EmailMessageSchema.index({ folder: 1, isRead: 1 });
// Add index for ticket linking
EmailMessageSchema.index({ ticketId: 1 });

module.exports = mongoose.model("EmailMessage", EmailMessageSchema);