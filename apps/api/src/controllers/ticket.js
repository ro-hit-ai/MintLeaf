// apps/api/src/controllers/ticket.controller.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { track } = require("../lib/hog");

const {
  sendAssignedEmail,
  sendComment,
  sendTicketCreate,
  sendTicketStatus,
} = require("../lib/nodemailer/ticket/email");

const {
  assignedNotification,
  commentNotification,
  priorityNotification,
  activeStatusNotification,
  statusUpdateNotification,
} = require("../lib/services/notifications/notification");

const { sendWebhookNotification } = require("../lib/services/notifications/webhook");
const { checkSession } = require("../lib/session");

// MODELS
const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const TimeTracking = require("../models/TimeTracking");
const Webhook = require("../models/Webhook");
const User = require("../models/User");
const Client = require("../models/Client");
const Counter = require("../models/Counter");
const { ImapService } = require("../lib/services/imap.service");
const logger = require("../lib/logger");

const router = express.Router();

// SOCKET - Import properly
const { getSocket, emitToTicket } = require("../socket");

/* --------------------------------------------
   HELPERS
--------------------------------------------- */

const populateTicket = () => [
  { path: "clientId", select: "id name number notes", strictPopulate: false },
  { path: "assignedTo", select: "id name email avatar" },
  { path: "team", select: "id name" },
  { path: "createdBy", select: "id name email avatar" },
];

const validateEmail = (email) =>
  String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

const generateTicketNumber = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "ticket" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `TKT-${String(counter.seq).padStart(6, "0")}`;
};

// Helper to emit socket events safely
const emitComment = (ticketId, comment) => {
  try {
    // Use the imported emitToTicket function
    emitToTicket(ticketId, "ticket:comment", comment);
    logger.info(`Socket event emitted for ticket ${ticketId}, comment ${comment._id}`);
  } catch (err) {
    logger.error("Failed to emit socket event:", err);
  }
};

/* --------------------------------------------
   CREATE TICKET
--------------------------------------------- */

const createTicket = async (req, res, isPublic = false) => {
  try {
    const { name, company, detail, title, priority, email, engineer, type, createdBy } =
      req.body;

    logger.info("Creating new ticket:", { title, email, isPublic });

    const user = isPublic ? null : await checkSession(req);

    let creatorId = createdBy;
    if (!creatorId && isPublic) {
      let guest = await User.findOne({ email: "guest@system.local" });
      if (!guest) {
        guest = await User.create({
          name: "Guest",
          email: "guest@system.local",
          password: "guest123",
          role: "guest",
        });
      }
      creatorId = guest._id;
    } else if (!creatorId) {
      creatorId = user?._id;
    }

    const number = req.body.number || (await generateTicketNumber());

    const ticketData = {
      name,
      title,
      detail: typeof detail === "object" ? JSON.stringify(detail) : detail,
      priority: priority || "low",
      email,
      type: type?.toLowerCase() || "support",
      createdBy: creatorId,
      fromImap: false,
      isComplete: false,
      number,
      originalMessageId: null,
    };

    if (company) ticketData.clientId = company.id || company;
    if (engineer && engineer !== "Unassigned")
      ticketData.assignedTo = engineer.id || engineer;

    const ticket = await Ticket.create(ticketData);
    logger.info(`Ticket created: ${ticket.number} (${ticket._id})`);

    if (email && validateEmail(email)) {
      try {
        await sendTicketCreate(ticket);
        logger.info(`Welcome email sent to ${email}`);
      } catch (emailErr) {
        logger.error("Failed to send welcome email:", emailErr);
      }
    }

    if (ticket.assignedTo) {
      const assignedUser = await User.findById(ticket.assignedTo);
      if (assignedUser) {
        try {
          await sendAssignedEmail(assignedUser.email);
          await assignedNotification(assignedUser, ticket, user || { _id: creatorId });
          logger.info(`Assignment notification sent to ${assignedUser.email}`);
        } catch (notifErr) {
          logger.error("Failed to send assignment notification:", notifErr);
        }
      }
    }

    // Webhooks
    const webhooks = await Webhook.find({
      type: "ticket_created",
      active: true,
    });

    for (const webhook of webhooks) {
      try {
        await sendWebhookNotification(webhook, {
          event: "ticket_created",
          id: ticket._id,
          title: ticket.title,
          priority: ticket.priority,
          email: ticket.email,
          name: ticket.name,
          type: ticket.type,
          createdBy: ticket.createdBy,
          assignedTo: ticket.assignedTo,
          client: ticket.clientId,
        });
      } catch (webhookErr) {
        logger.error("Webhook notification failed:", webhookErr);
      }
    }

    // Create initial comment from ticket description
    const initialComment = await Comment.create({
      text: typeof detail === "object" ? JSON.stringify(detail) : detail,
      ticketId: ticket._id,
      userId: creatorId,
      public: true,
      reply: true, // Original ticket is considered a "reply" from customer
      replyEmail: email,
      fromAgent: false,
      type: "user",
    });

    logger.info(`Initial comment created for ticket ${ticket.number}`);

    // Emit socket event for new ticket
    const io = getSocket();
    if (io) {
      io.emit("ticket:new", ticket);
      logger.info(`Socket event emitted: ticket:new for ${ticket._id}`);
    }

    track().capture({ event: "ticket_created", distinctId: ticket._id.toString() });

    res.send({ 
      success: true, 
      message: "Ticket created", 
      id: ticket._id,
      number: ticket.number 
    });
  } catch (error) {
    logger.error("Ticket create error:", error);
    return res.status(500).send({ success: false, message: error.message });
  }
};

router.post("/create", (req, res) => createTicket(req, res, false));
router.post("/public/create", (req, res) => createTicket(req, res, true));

/* --------------------------------------------
   LIST ROUTES — MUST BE ABOVE /:id
--------------------------------------------- */

router.get("/tickets/open", (req, res) =>
  fetchTickets({ isComplete: false }, req, res)
);

router.get("/tickets/completed", (req, res) =>
  fetchTickets({ isComplete: true }, req, res)
);

router.get("/tickets/unassigned", (req, res) =>
  fetchTickets({ isComplete: false, assignedTo: null }, req, res)
);

/* --------------------------------------------
   USER SPECIFIC (Agent)
--------------------------------------------- */

router.get("/tickets/user/open", async (req, res) => {
  try {
    const user = await checkSession(req);

    const tickets = await Ticket.find({
      isComplete: false,
      assignedTo: user._id,
      hidden: false,
    })
      .sort({ createdAt: -1 })
      .populate(populateTicket());

    res.send({ success: true, tickets });
  } catch (error) {
    logger.error("Error fetching user open tickets:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

router.get("/tickets/user/completed", async (req, res) => {
  try {
    const user = await checkSession(req);

    const tickets = await Ticket.find({
      isComplete: true,
      assignedTo: user._id,
      hidden: false,
    })
      .sort({ createdAt: -1 })
      .populate(populateTicket());

    res.send({ success: true, tickets });
  } catch (error) {
    logger.error("Error fetching user completed tickets:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

/* --------------------------------------------
   SHARED FETCH FUNCTION
--------------------------------------------- */

const fetchTickets = async (filter, req, res) => {
  try {
    await checkSession(req);

    const tickets = await Ticket.find({ ...filter, hidden: false })
      .sort({ createdAt: -1 })
      .populate(populateTicket());

    res.send({ success: true, tickets });
  } catch (error) {
    logger.error("Error fetching tickets:", error);
    res.status(500).send({ success: false, message: error.message });
  }
};

/* --------------------------------------------
   TICKET DETAIL — MUST BE LAST
--------------------------------------------- */

router.get("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(populateTicket());

    if (!ticket)
      return res.status(404).send({ success: false, message: "Ticket not found" });

    const [timeTracking, comments] = await Promise.all([
      TimeTracking.find({ ticketId: ticket._id }).populate("userId", "name"),
      Comment.find({ ticketId: ticket._id })
        .populate("userId", "name avatar email role")  // Added role for better identification
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    // Process comments to ensure consistent structure
    const processedComments = comments.map(comment => {
      // Ensure reply field is boolean
      comment.reply = Boolean(comment.reply);
      
      // Ensure fromAgent field is boolean
      comment.fromAgent = Boolean(comment.fromAgent);
      
      // If userId is populated and has email, use it for consistency
      if (comment.userId && typeof comment.userId === 'object') {
        comment.userId = {
          _id: comment.userId._id,
          name: comment.userId.name || comment.userId.email,
          email: comment.userId.email,
          avatar: comment.userId.avatar,
          role: comment.userId.role
        };
      }
      
      return comment;
    });

    logger.info(`Ticket detail fetched: ${ticket.number}, ${processedComments.length} comments`);

    res.send({
      success: true,
      ticket: ticket.toObject(),
      comments: processedComments,
      timeTracking: timeTracking || [],
    });
  } catch (error) {
    logger.error("Ticket detail error:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

/* --------------------------------------------
   ADD COMMENT (AGENT REPLY)
--------------------------------------------- */

router.put("/comment", async (req, res) => {
  try {
    const user = await checkSession(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id: ticketId, text, public: isPublic = true } = req.body;
    if (!ticketId || !text?.trim()) {
      return res.status(400).json({ success: false, message: "Missing ticket ID or comment text" });
    }

    logger.info("Adding comment:", {
      ticketId,
      userId: user._id,
      textLength: text.length,
      isPublic
    });

    // Check if ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Create comment
    const comment = await Comment.create({
      text: text.trim(),
      userId: user._id,
      ticketId,
      public: Boolean(isPublic),
      reply: false, // Agent comments are NOT email replies
      fromAgent: true, // Add this flag to identify agent comments
      type: "user",
    });

    // Populate comment with user data
    const populated = await Comment.findById(comment._id)
      .populate("userId", "name avatar email role")
      .lean();

    // Ensure boolean fields
    populated.reply = false;
    populated.fromAgent = true;
    
    // Ensure user object has proper structure
    if (populated.userId && typeof populated.userId === 'object') {
      populated.userId = {
        _id: populated.userId._id,
        name: populated.userId.name || populated.userId.email,
        email: populated.userId.email,
        avatar: populated.userId.avatar,
        role: populated.userId.role
      };
    }

    logger.info(`Comment created: ${comment._id} for ticket ${ticketId}`);

    // ────── SEND PUBLIC AGENT COMMENT TO CUSTOMER VIA EMAIL ──────
    if (isPublic) {
      try {
        const emailSent = await ImapService.sendCommentAsEmail(
          ticketId,
          text.trim(),
          user.name || user.email || "Support Team"
        );
        
        if (emailSent) {
          logger.info(`Comment emailed to ${ticket.email} for ticket ${ticket.number}`);
        } else {
          logger.warn(`Failed to email comment for ticket ${ticket.number}`);
        }
      } catch (emailErr) {
        logger.error("Error sending comment email:", emailErr);
        // Don't fail the request if email fails
      }
    }
    // ─────────────────────────────────────────────────────────────

    // Emit socket event for real-time update
    emitComment(ticketId, populated);

    // Also send notification
    try {
      await commentNotification(ticket, user, text.trim());
    } catch (notifErr) {
      logger.error("Failed to send comment notification:", notifErr);
    }

    logger.info(`Comment successfully added and socket event emitted for ticket ${ticketId}`);

    return res.json({ 
      success: true, 
      comment: populated,
      message: "Comment added successfully" 
    });
  } catch (err) {
    logger.error("Comment route error:", err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to add comment" 
    });
  }
});

/* --------------------------------------------
   STATUS UPDATE
--------------------------------------------- */

router.put("/status/update", async (req, res) => {
  try {
    const { status, id } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: "Ticket ID required" });
    }

    logger.info("Updating ticket status:", { ticketId: id, status });

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { isComplete: Boolean(status) },
      { new: true }
    ).populate(populateTicket());

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const io = getSocket();
    if (io) {
      io.emit("ticket:status", ticket);
      io.to(`ticket:${id}`).emit("ticket:status", ticket);
      logger.info(`Socket event emitted: ticket:status for ${id}`);
    }

    // Send status update notification
    try {
      await statusUpdateNotification(ticket);
    } catch (notifErr) {
      logger.error("Failed to send status notification:", notifErr);
    }

    res.send({ 
      success: true, 
      ticket,
      message: `Ticket ${ticket.isComplete ? 'closed' : 'reopened'} successfully` 
    });
  } catch (err) {
    logger.error("Status update error:", err);
    res.status(500).send({ success: false, message: err.message });
  }
});

/* --------------------------------------------
   ASSIGN TICKET
--------------------------------------------- */

router.patch("/assign/:id", async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticketId = req.params.id;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: "Ticket ID required" });
    }

    logger.info("Assigning ticket:", { ticketId, assignedTo });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const oldAssignee = ticket.assignedTo;
    ticket.assignedTo = assignedTo || null;
    await ticket.save();

    const populated = await Ticket.findById(ticket._id).populate(
      "assignedTo",
      "name email avatar"
    );

    const io = getSocket();
    if (io) {
      // Notify new assignee
      if (ticket.assignedTo) {
        io.to(`user:${ticket.assignedTo}`).emit("ticket:assigned", populated);
      }
      
      // Notify old assignee if changed
      if (oldAssignee && oldAssignee.toString() !== assignedTo) {
        io.to(`user:${oldAssignee}`).emit("ticket:unassigned", populated);
      }
      
      // Broadcast general update
      io.emit("ticket:update", populated);
      io.to(`ticket:${ticketId}`).emit("ticket:update", populated);
      
      logger.info(`Socket events emitted for assignment of ticket ${ticketId}`);
    }

    // Send assignment notification
    if (ticket.assignedTo) {
      try {
        const assignedUser = await User.findById(ticket.assignedTo);
        if (assignedUser) {
          await sendAssignedEmail(assignedUser.email);
          await assignedNotification(assignedUser, ticket, { _id: req.user?._id });
        }
      } catch (notifErr) {
        logger.error("Failed to send assignment notification:", notifErr);
      }
    }

    res.json({ 
      success: true, 
      ticket: populated,
      message: assignedTo ? "Ticket assigned successfully" : "Ticket unassigned" 
    });
  } catch (err) {
    logger.error("Assign ticket error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* --------------------------------------------
   ADDITIONAL ROUTES
--------------------------------------------- */

// Search tickets
router.post("/tickets/search", async (req, res) => {
  try {
    await checkSession(req);
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query required" });
    }

    const tickets = await Ticket.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { number: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { detail: { $regex: query, $options: "i" } },
      ],
      hidden: false,
    })
      .limit(50)
      .populate(populateTicket());

    res.json({ success: true, tickets });
  } catch (err) {
    logger.error("Ticket search error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get ticket summary
router.get("/summary", async (req, res) => {
  try {
    const user = await checkSession(req);

    const [open, completed, unassigned, userTickets] = await Promise.all([
      Ticket.countDocuments({ isComplete: false, hidden: false }),
      Ticket.countDocuments({ isComplete: true, hidden: false }),
      Ticket.countDocuments({ isComplete: false, assignedTo: null, hidden: false }),
      Ticket.countDocuments({ assignedTo: user._id, isComplete: false, hidden: false }),
    ]);

    res.json({
      success: true,
      summary: { open, completed, unassigned, userTickets },
    });
  } catch (err) {
    logger.error("Ticket summary error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk actions
router.post("/tickets/bulk", async (req, res) => {
  try {
    await checkSession(req);
    const { ticketIds, action, data } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ success: false, message: "No tickets selected" });
    }

    let update = {};
    let message = "";

    switch (action) {
      case "assign":
        update.assignedTo = data?.assignedTo || null;
        message = "Tickets assigned";
        break;
      case "status":
        update.isComplete = Boolean(data?.status);
        message = "Ticket status updated";
        break;
      case "priority":
        update.priority = data?.priority || "medium";
        message = "Ticket priority updated";
        break;
      case "delete":
        update.hidden = true;
        message = "Tickets deleted";
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const result = await Ticket.updateMany(
      { _id: { $in: ticketIds } },
      { $set: update }
    );

    // Emit socket events for updated tickets
    const io = getSocket();
    if (io) {
      ticketIds.forEach(ticketId => {
        io.to(`ticket:${ticketId}`).emit("ticket:update", { _id: ticketId, ...update });
      });
    }

    res.json({
      success: true,
      message: `${message} (${result.modifiedCount} tickets)`,
      count: result.modifiedCount,
    });
  } catch (err) {
    logger.error("Bulk action error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;