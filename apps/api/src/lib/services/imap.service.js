// apps/api/src/lib/services/imap.service.js
// SAFETY-FOCUSED IMAP SERVICE (NO CRASH, NO SPAM)

const express = require("express");
const EmailReplyParser = require("email-reply-parser");
const ImapSimple = require("imap-simple");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");

const AuthService = require("./authService");
const EmailQueue = require("../../models/EmailQueue");
const Ticket = require("../../models/Ticket");
const Comment = require("../../models/Comment");
const Counter = require("../../models/Counter");
const EmailMessage = require("../../models/EmailMessage");
const User = require("../../models/User");
const logger = require("../logger");

const router = express.Router();

/* -------------------------------------------------------
   GLOBAL LOCK + COOLDOWNS
------------------------------------------------------- */
let isFetching = false;
let lastFetchStartedAt = 0;
let lastFetchCompletedAt = 0;
let lastFailureAt = 0;

const MIN_FETCH_INTERVAL = 10 * 60 * 1000;
const FAILURE_COOLDOWN = 30 * 60 * 1000;

let io = null;

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function getReplyText(email) {
  if (!email?.text) return email?.html || "";

  try {
    const parser = new EmailReplyParser();
    const parsed = parser.read(email.text);
    const visible = parsed
      .getFragments()
      .filter(f => !f._isHidden && !f._isSignature && !f._isQuoted);

    return (
      visible.map(f => f._content.trim()).join("\n") ||
      email.text.substring(0, 500)
    );
  } catch {
    return email.text || email.html || "";
  }
}

/* -------------------------------------------------------
   IMAP SERVICE
------------------------------------------------------- */

class ImapService {
  static setSocketInstance(socketInstance) {
    io = socketInstance;
    logger.info("Socket.io instance set in ImapService");
  }

  /* =======================
     ✅ CORRECT IMAP CONFIG
     ======================= */
static async getImapConfig(queue) {
  try {
    if (queue.serviceType === "custom") {
      const config = {
        user: queue.username,          // ✅ MUST be full email
        password: queue.password,      // Rohit@2026
        host: queue.hostname,          // grssl.yukthi.net
        port: 993,                     // IMAPS
        tls: true,                     // node-imap uses tls
        authTimeout: 30000,
        connTimeout: 45000,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      };

      logger.info("IMAP config:", {
        host: config.host,
        port: config.port,
        user: config.user,
        tls: config.tls,
      });

      return config;
    }

    // Gmail OAuth (unchanged)
    const accessToken = await AuthService.getValidAccessToken(queue);
    const xoauth2 = Buffer.from(
      `user=${queue.username}\u0001auth=Bearer ${accessToken}\u0001\u0001`
    ).toString("base64");

    return {
      user: queue.username,
      xoauth2,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };
  } catch (err) {
    logger.error("getImapConfig failed:", err.message);
    return null;
  }
}




  static async connectSafely(imapConfig) {
    if (!imapConfig) return null;

    try {
      logger.info(`Attempting IMAP connect to ${imapConfig.host}:${imapConfig.port}`);
      const connection = await ImapSimple.connect({ imap: imapConfig });

      connection.on("error", err =>
        logger.error("IMAP runtime error:", err.message)
      );

      return connection;
    } catch (err) {
      logger.error(
        `IMAP Connection FAILED to ${imapConfig.host}:${imapConfig.port} – ${err.message}`
      );
      return null;
    }
  }

static async fetchFolderMails(connection, queue, folderName, mailboxId) {
  if (!connection) return;

  try {
    const box = await connection.openBox(folderName, { readOnly: false });
    logger.info(`Folder "${folderName}" opened. Messages: ${box.messages.total}`);

    const results = await connection.search(["ALL"], {
      bodies: [""],
      struct: true,
    });

    logger.info(`Found ${results.length} total emails`);

    for (const message of results) {
      const uid = message.attributes.uid;

      try {
        // 🔒 Deduplication guard
        const exists = await EmailMessage.exists({
          imapUid: uid,
          mailboxId,
        });

        if (exists) {
          logger.debug(`Skipping UID ${uid} (already processed)`);
          continue;
        }

        const raw = message.parts.find(p => p.which === "").body;
        const parsed = await simpleParser(raw);

        await this.processEmail(parsed, mailboxId, queue);

        // ✅ Mark + move ONLY after success
        await connection.addFlags(uid, ["\\Seen"]);
        await this.ensureFolderExists(connection, "Processed");
        await connection.moveMessage(uid, "Processed");

      } catch (err) {
        logger.error(`Error processing UID ${uid}:`, err.message);
      }
    }

    await queue.updateHealth("healthy");

  } catch (err) {
    logger.error("IMAP fetch error:", err.message);
    await queue.updateHealth("failed", err);
  }
}


  static async ensureFolderExists(connection, folder) {
    try {
      await connection.openBox(folder);
    } catch {
      await connection.addBox(folder);
    }
  }

  static async processEmail(parsed, mailboxId, queue) {
    try {
      const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase();
      if (!fromEmail || fromEmail === queue.username) return;

      const replyText = getReplyText(parsed);

      let ticket = await Ticket.findOne({
        email: fromEmail,
        originalMessageId: parsed.inReplyTo,
      });

      if (ticket) {
        await Comment.create({
          ticketId: ticket._id,
          text: replyText,
          reply: true,
          replyEmail: fromEmail,
          public: true,
          type: "user",
        });
        return;
      }

      const counter = await Counter.findByIdAndUpdate(
        { _id: "ticket" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      ticket = await Ticket.create({
        email: fromEmail,
        title: parsed.subject || "No subject",
        detail: replyText,
        number: `TKT-${String(counter.seq).padStart(6, "0")}`,
        originalMessageId: parsed.messageId,
      });

      await Comment.create({
        ticketId: ticket._id,
        text: replyText,
        reply: true,
        replyEmail: fromEmail,
        public: true,
        type: "user",
      });
    } catch (err) {
      logger.error("processEmail failed:", err.message);
    }
  }

  static async fetchEmails(trigger = "auto") {
    if (isFetching) return;
    isFetching = true;

    try {
      const queues = await EmailQueue.findActiveQueues();
      for (const queue of queues) {
        const config = await this.getImapConfig(queue);
        const conn = await this.connectSafely(config);
        if (!conn) continue;

        await this.fetchFolderMails(conn, queue, "INBOX", queue._id);
        conn.end();
      }
    } finally {
      isFetching = false;
    }
  }
}

/* -------------------------------------------------------
   ROUTES
------------------------------------------------------- */

router.post("/test-fetch", async (req, res) => {
  const queues = await EmailQueue.findActiveQueues();
  const config = await ImapService.getImapConfig(queues[0]);
  const conn = await ImapService.connectSafely(config);
  if (!conn) return res.status(500).json({ success: false });

  const box = await conn.openBox("INBOX", { readOnly: false });
  const results = await conn.search(["UNSEEN"], { markSeen: true });
  conn.end();

  res.json({ success: true, count: results.length });
});

router.post("/fetch-emails", async (req, res) => {
  try {
    const result = await ImapService.fetchEmails("manual");
    return res.status(202).json({
      success: true,
      ...result,
    });
  } catch (err) {
    logger.error("Manual fetch-emails error:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});
// Health
router.get("/health", async (req, res) => {
  try {
    const queues = await EmailQueue.find({})
      .select("username hostname healthStatus lastHealthCheck active")
      .lean();

    res.json({
      success: true,
      engine: ImapService.getFetchState(),
      queues,
      socketAvailable: !!io
    });
  } catch (err) {
    logger.error("Error fetching IMAP health:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Priority stats
router.get("/priority-stats", async (req, res) => {
  try {
    const stats = await EmailMessage.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const total = await EmailMessage.countDocuments();
    const pending = await EmailMessage.countDocuments({
      priority: "pending",
      sentiment_analyzed: { $ne: true },
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmails: total,
        pendingAnalysis: pending,
        distribution: stats,
        lastUpdated: new Date(),
      },
    });
  } catch (err) {
    logger.error("Error fetching priority stats:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch priority stats" });
  }
});

// List emails
router.get("/emails", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const emails = await EmailMessage.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await EmailMessage.countDocuments();

    res.status(200).json({
      success: true,
      emails,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error("Error fetching emails:", err.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

// Single email
router.get("/emails/:id", async (req, res) => {
  try {
    const email = await EmailMessage.findById(req.params.id);
    if (!email)
      return res
        .status(404)
        .json({ message: "Email not found", success: false });
    res.status(200).json({ email, success: true });
  } catch (err) {
    logger.error("Error fetching single email:", err.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

// Move one
router.post("/emails/:id/move", async (req, res) => {
  try {
    const { folder } = req.body;
    if (!folder)
      return res
        .status(400)
        .json({ message: "Folder is required", success: false });

    const email = await EmailMessage.findById(req.params.id);
    if (!email)
      return res
        .status(404)
        .json({ message: "Email not found", success: false });

    email.folder = folder;
    await email.save();

    res
      .status(200)
      .json({ message: `Email moved to ${folder}`, success: true });
  } catch (err) {
    logger.error("Error moving email:", err.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

// Move many
router.post("/emails/move", async (req, res) => {
  try {
    const { emailIds, folder } = req.body;
    if (!Array.isArray(emailIds) || !emailIds.length) {
      return res
        .status(400)
        .json({ message: "No emails provided", success: false });
    }
    if (!folder)
      return res
        .status(400)
        .json({ message: "Folder is required", success: false });

    await EmailMessage.updateMany(
      { _id: { $in: emailIds } },
      { $set: { folder } }
    );

    res.status(200).json({
      message: `Moved ${emailIds.length} emails to ${folder}`,
      success: true,
    });
  } catch (err) {
    logger.error("Error moving emails:", err.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

// Mark read
router.post("/emails/:id/read", async (req, res) => {
  try {
    const email = await EmailMessage.findById(req.params.id);
    if (!email)
      return res
        .status(404)
        .json({ message: "Email not found", success: false });

    email.isRead = true;
    await email.save();

    res
      .status(200)
      .json({ message: "Email marked as read", success: true });
  } catch (err) {
    logger.error("Error marking email as read:", err.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

// Mark unread
router.post("/emails/:id/unread", async (req, res) => {
  try {
    const email = await EmailMessage.findById(req.params.id);
    if (!email)
      return res
        .status(404)
        .json({ message: "Email not found", success: false });

    email.isRead = false;
    await email.save();

    res
      .status(200)
      .json({ message: "Email marked as unread", success: true });
  } catch (err) {
    logger.error("Error marking email as unread:", err.message);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

module.exports = {
  router,
  ImapService,
};