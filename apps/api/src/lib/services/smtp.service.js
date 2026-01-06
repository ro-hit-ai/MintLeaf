const express = require('express');
const EmailReplyParser = require('email-reply-parser');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const AuthService = require('./authService');
const EmailQueue = require('../../models/EmailQueue');
const Ticket = require('../../models/Ticket');
const Comment = require('../../models/Comment');
const ImapEmail = require('../../models/ImapEmail');

const router = express.Router();

// -------------------- Helper --------------------
function getReplyText(email) {
  const parsed = new EmailReplyParser().read(email.text);
  let replyText = '';
  parsed.getFragments().forEach(f => {
    if (!f._isHidden && !f._isSignature && !f._isQuoted) {
      replyText += f._content;
    }
  });
  return replyText;
}

// -------------------- IMAP Service --------------------
class MailService {
  // Get IMAP config
  static async getImapConfig(queue) {
    switch (queue.serviceType) {
      case "gmail":
        const token = await AuthService.getValidAccessToken(queue);
        return {
          user: queue.username,
          host: queue.hostname,
          port: 993,
          tls: true,
          xoauth2: AuthService.generateXOAuth2Token(queue.username, token),
          tlsOptions: { rejectUnauthorized: false, servername: queue.hostname },
        };
      case "other":
        return {
          user: queue.username,
          password: queue.password,
          host: queue.hostname,
          port: queue.tls ? 993 : 143,
          tls: queue.tls || false,
          tlsOptions: { rejectUnauthorized: false, servername: queue.hostname },
        };
      default:
        throw new Error("Unsupported service type");
    }
  }

  // Get SMTP transporters
 static async getSmtpTransporter(queue) {
  if (queue.serviceType === "custom") {
    return nodemailer.createTransport({
      host: queue.hostname,
      port: queue.smtpPort || 465,
      secure: queue.smtpPort === 465,
      auth: { user: queue.username, pass: queue.password }
    });
  } else if (queue.serviceType === "gmail") {
    const token = await AuthService.getValidAccessToken(queue); // Ensure AuthService is implemented
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: queue.username,
        accessToken: token,
        clientId: queue.clientId,
        clientSecret: queue.clientSecret,
        refreshToken: queue.refreshToken,
      },
    });
  }
  throw new Error("Unsupported SMTP service type");
}
  // Send email via SMTP
  static async sendEmail({ to, subject, text, html, queue }) {
    const transporter = await this.getSmtpTransporter(queue);
    return transporter.sendMail({ from: queue.username, to, subject, text, html });
  }

  // Process email (IMAP)
  static async processEmail(parsed, isReply) {
    const { from, subject, text, html, textAsHtml } = parsed;

    if (isReply) {
      const ticketId = subject.match(/(?:ref:|#)([0-9a-f\-]{36})/)?.[1];
      if (!ticketId) throw new Error("Ticket ID not found in subject");

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);

      const replyText = getReplyText(parsed);
      await Comment.create({
        text: text ? replyText : "No Body",
        userId: null,
        ticketId: ticket._id,
        reply: true,
        replyEmail: from.value[0].address,
        public: true,
      });
    } else {
      const imapEmail = await ImapEmail.create({
        from: from.value[0].address,
        subject: subject || "No Subject",
        body: text || "No Body",
        html: html || "",
        text: textAsHtml,
      });

      const ticketCount = await Ticket.countDocuments();
      const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;

      await Ticket.create({
        Number: ticketNumber,
        email: from.value[0].address,
        name: from.value[0].name,
        title: imapEmail.subject || "-",
        isComplete: false,
        priority: "low",
        fromImap: true,
        detail: html || textAsHtml,
      });
    }
  }

  // Fetch emails (IMAP)
  static async fetchEmails() {
    const queues = await EmailQueue.find({ active: true });
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    for (const queue of queues) {
      try {
        const imapConfig = await this.getImapConfig(queue);
        const imap = new Imap(imapConfig);

        await new Promise((resolve, reject) => {
          imap.once("ready", () => {
            imap.openBox("INBOX", false, (err) => {
              if (err) return reject(err);

              imap.search(["UNSEEN", ["ON", dateString]], (err, results) => {
                if (err) return reject(err);
                if (!results || !results.length) {
                  imap.end();
                  return resolve();
                }

                const fetch = imap.fetch(results, { bodies: "" });
                fetch.on("message", (msg) => {
                  msg.on("body", (stream) => {
                    simpleParser(stream, async (err, parsed) => {
                      if (err) return console.error(err);
                      const isReply = (parsed.subject || "").toLowerCase().includes("re:") ||
                                      (parsed.subject || "").toLowerCase().includes("ref:");
                      await this.processEmail(parsed, isReply);
                    });
                  });
                  msg.once("attributes", attrs => imap.addFlags(attrs.uid, ["\\Seen"], () => {}));
                });

                fetch.once("end", () => imap.end());
              });
            });
          });

          imap.once("error", reject);
          imap.once("end", resolve);
          imap.connect();
        });
      } catch (error) {
        console.error(`Queue ${queue._id} error:`, error);
      }
    }
  }
}

// -------------------- Routes --------------------

// Trigger IMAP fetch
router.post('/fetch-emails', async (req, res) => {
  MailService.fetchEmails().catch(err => console.error(err));
  res.status(202).json({ message: 'IMAP fetch started', success: true });
});

// Send email via SMTP
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, queueId } = req.body;
    const queue = await EmailQueue.findById(queueId);
    if (!queue) throw new Error("Queue not found");

    await MailService.sendEmail({ to, subject, text, html, queue });
    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('SMTP send error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List IMAP emails
router.get('/emails', async (req, res) => {
  const emails = await ImapEmail.find({}).sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, emails });
});

// Reply to ticket (uses MailService)
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { text, queueId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // 🔑 Find the correct email queue
    const queue = await EmailQueue.findById(queueId);
    if (!queue) return res.status(400).json({ message: 'Invalid queueId' });

    // ✅ Use MailService for SMTP
    const mail = await MailService.sendEmail({
      to: ticket.email,
      subject: `Re: ${ticket.title} #${ticket._id}`,
      text,
      queue
    });

    // Save comment in DB
    const comment = await Comment.create({
      text,
      userId: req.user?._id || null, // agent ID (if available)
      ticketId: ticket._id,
      reply: true,
      replyEmail: ticket.email,
      public: true,
    });

    // Save agent email in "sent" folder
    await ImapEmail.create({
      from: queue.username,
      to: [ticket.email],
      subject: `Re: ${ticket.title} #${ticket._id}`,
      body: text,
      folder: 'sent',
      messageId: mail.messageId,
      date: new Date(),
    });

    res.status(200).json({ message: 'Reply sent and ticket updated', success: true, comment });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

module.exports = { router, MailService };
