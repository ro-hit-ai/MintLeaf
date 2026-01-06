const express = require("express");
const EmailMessage = require("../models/EmailMessage");
const EmailQueue = require("../models/EmailQueue");

const router = express.Router();

/**
 * 📥 Get all inbox messages
 */
router.get("/:mailboxId/inbox", async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const inbox = await EmailMessage.find({ mailbox: mailboxId, folder: "inbox" }).sort({ date: -1 });
    res.status(200).json({ success: true, inbox });
  } catch (error) {
    console.error("Error fetching inbox:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 📤 Get all sent messages
 */
router.get("/:mailboxId/sent", async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const sent = await EmailMessage.find({ mailbox: mailboxId, folder: "sent" }).sort({ date: -1 });
    res.status(200).json({ success: true, sent });
  } catch (error) {
    console.error("Error fetching sent messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 📬 Get all received messages
 */
router.get("/:mailboxId/received", async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const received = await EmailMessage.find({ mailbox: mailboxId, folder: "received" }).sort({ date: -1 });
    res.status(200).json({ success: true, received });
  } catch (error) {
    console.error("Error fetching received messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 📨 Save new email (when fetched from IMAP or sent via SMTP)
 */
router.post("/:mailboxId/save", async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const { subject, body, from, to, folder, isRead, attachments } = req.body;

    const mailbox = await EmailQueue.findById(mailboxId);
    if (!mailbox) {
      return res.status(404).json({ success: false, message: "Mailbox not found" });
    }

    const email = new EmailMessage({
      mailbox: mailboxId,
      subject,
      body,
      from,
      to,
      folder: folder || "inbox",
      isRead: isRead || false,
      attachments
    });

    await email.save();

    res.status(201).json({ success: true, message: "Email saved successfully", email });
  } catch (error) {
    console.error("Error saving email:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
