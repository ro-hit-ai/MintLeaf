const express = require('express');
const mongoose = require('mongoose');
const handlebars = require('handlebars');
const nodemailer = require("nodemailer");
const { createTransportProvider } = require('../../transport');
const { requirePermission } = require('../../roles');
const { checkSession } = require('../../session');
const Email = require('../../../models/Email');
const EmailTemplate = require('../../../models/EmailTemplate');
const EmailQueue = require('../../../models/EmailQueue');

const router = express.Router();

// ==================== EMAIL HELPER FUNCTIONS ====================

/**
 * Send assigned email
 */
async function sendAssignedEmail(email) {
  try {
    const provider = await Email.findOne();

    if (provider) {
      const mail = await createTransportProvider(provider);

      console.log("Sending email to: ", email);

      const testhtml = await EmailTemplate.findOne({
        type: "ticket_assigned"
      });

      if (!testhtml) {
        console.log("Email template not found");
        return;
      }

      const template = handlebars.compile(testhtml.html);
      const htmlToSend = template({});

      await mail
        .sendMail({
          from: provider.reply,
          to: email,
          subject: `A new ticket has been assigned to you`,
          text: `Hello there, a ticket has been assigned to you`,
          html: htmlToSend,
        })
        .then((info) => {
          console.log("Message sent: %s", info.messageId);
        })
        .catch((err) => console.log(err));
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Send comment email (used for auto-replies & manual comment notifications)
 * comment: string, title: ticket title, ticketId: id, email: recipient
 */
async function sendComment(comment, title, ticketId, email) {
  try {
    const provider = await Email.findOne();
    if (!provider) {
      console.log("No Email provider configured for sendComment");
      return false;
    }

    const mail = await createTransportProvider(provider);
    const templateData = await EmailTemplate.findOne({ type: "ticket_comment" });

    if (!templateData) {
      console.log("Comment email template not found (ticket_comment)");
      return false;
    }

    const template = handlebars.compile(templateData.html);
    const replacements = { comment, title, ticketId, email };
    const htmlToSend = template(replacements);

    await mail.sendMail({
      from: provider.reply,
      to: email,
      subject: `New comment on ticket: ${title}`,
      text: `A new comment has been added to ticket ${title}: ${comment}`,
      html: htmlToSend,
    });

    console.log("Comment email sent successfully to", email);
    return true;
  } catch (error) {
    console.error('Error sending comment email:', error);
    return false;
  }
}


/**
 * Send ticket creation email
 */
async function sendTicketCreate(ticket) {
  try {
    const emailConfig = await Email.findOne();

    if (!emailConfig) {
      console.log("Email provider not configured");
      return false;
    }

    const transport = await createTransportProvider(emailConfig);

    const templateData = await EmailTemplate.findOne({
      type: "ticket_created"
    });

    if (!templateData) {
      console.log("Email template not found");
      return false;
    }

    const template = handlebars.compile(templateData.html);
    const replacements = {
      id: ticket._id || ticket.id,
      title: ticket.title,
      description: ticket.description,
      email: ticket.email,
      createdAt: ticket.createdAt,
      status: ticket.status,
      priority: ticket.priority
    };
    
    const htmlToSend = template(replacements);

    const info = await transport.sendMail({
      from: emailConfig.reply,
      to: ticket.email,
      subject: `Issue #${ticket._id || ticket.id} has just been created & logged`,
      text: `Hello there, Issue #${ticket._id || ticket.id}, which you reported on ${ticket.createdAt}, has now been created and logged`,
      html: htmlToSend,
    });

    console.log("Message sent: %s", info.messageId);
    return true;

  } catch (error) {
    console.error('Error sending ticket creation email:', error);
    return false;
  }
}

/**
 * Send ticket status update email
 */
async function sendTicketStatus(ticket) {
  try {
    // 🔹 Get Gmail config from EmailQueue
    const emailConfig = await EmailQueue.findOne({ serviceType: "gmail", active: true });
    if (!emailConfig) throw new Error("Email provider not configured in EmailQueue");

    // 🔹 Setup transporter with Gmail OAuth2
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: emailConfig.username,
        clientId: emailConfig.clientId,
        clientSecret: emailConfig.clientSecret,
        refreshToken: emailConfig.refreshToken,
        accessToken: emailConfig.accessToken,
      },
    });

    // 🔹 Load template
    const templateData = await EmailTemplate.findOne({ type: "ticket_status_changed" });
    if (!templateData) throw new Error("Email template not found (ticket_status_changed)");

    const template = handlebars.compile(templateData.html);
    const replacements = {
      title: ticket.title,
      status: ticket.isComplete ? "COMPLETED" : "OUTSTANDING",
      ticketNumber: ticket.Number || ticket.number || ticket.id,
      email: ticket.email,
    };
    const htmlToSend = template(replacements);
    const statusText = ticket.isComplete ? "COMPLETED" : "OUTSTANDING";

    // 🔹 Send email
    await transport.sendMail({
      from: emailConfig.username,
      to: ticket.email,
      subject: `Issue #${ticket.Number || ticket.number || ticket.id} status is now ${statusText}`,
      text: `Hello, issue #${ticket.Number || ticket.number || ticket.id} is now marked as ${statusText}.`,
      html: htmlToSend,
    });

    console.log(`✅ Ticket status email sent to ${ticket.email}`);
    return true;
  } catch (err) {
    console.error("Error in sendTicketStatus:", err);
    return false;
  }
}

// ==================== ROUTE HANDLERS ====================

// Send assigned email endpoint
router.post('/send-assigned', requirePermission(['email::send']), async (req, res) => {
  try {
    const user = await checkSession(req);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required', success: false });
    }

    await sendAssignedEmail(email);

    res.status(200).json({ message: 'Email sent successfully', success: true });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// Send comment email endpoint
router.post('/send-comment', requirePermission(['email::send']), async (req, res) => {
  try {
    const user = await checkSession(req);
    const { comment, title, ticketId, email } = req.body;

    // Validate required fields
    if (!comment || !title || !ticketId || !email) {
      return res.status(400).json({ 
        message: 'Comment, title, ticketId, and email are required', 
        success: false 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format', 
        success: false 
      });
    }

    const success = await sendComment(comment, title, ticketId, email);

    if (success) {
      res.status(200).json({ 
        message: 'Comment email sent successfully', 
        success: true 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send comment email', 
        success: false 
      });
    }

  } catch (err) {
    console.error('Error sending comment email:', err);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      success: false 
    });
  }
});

// Get email configuration
router.get('/config', requirePermission(['email::read']), async (req, res) => {
  try {
    const emailConfig = await Email.findOne();
    res.status(200).json({ emailConfig, success: true });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// Update email configuration
router.put('/api/v1/email/config', requirePermission(['email::update']), async (req, res) => {
  try {
    const { host, port, secure, user, pass, reply } = req.body;
    
    let emailConfig = await Email.findOne();
    
    if (emailConfig) {
      emailConfig.host = host;
      emailConfig.port = port;
      emailConfig.secure = secure;
      emailConfig.user = user;
      emailConfig.pass = pass;
      emailConfig.reply = reply;
      emailConfig.updatedAt = new Date();
      await emailConfig.save();
    } else {
      emailConfig = new Email({
        host,
        port,
        secure,
        user,
        pass,
        reply
      });
      await emailConfig.save();
    }

    res.status(200).json({ message: 'Email configuration updated', success: true });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// Get email templates
router.get('/templates', requirePermission(['email::read']), async (req, res) => {
  try {
    const templates = await EmailTemplate.find({});
    res.status(200).json({ templates, success: true });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// Update email template
router.put('/template/:type', requirePermission(['email::update']), async (req, res) => {
  try {
    const { type } = req.params;
    const { html, subject } = req.body;

    let template = await EmailTemplate.findOne({ type });

    if (template) {
      template.html = html;
      template.subject = subject;
      template.updatedAt = new Date();
      await template.save();
    } else {
      template = new EmailTemplate({
        type,
        html,
        subject
      });
      await template.save();
    }

    res.status(200).json({ message: 'Template updated', success: true });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// Get email templates (alternative endpoint)
router.get('/api/v1/email/templates', requirePermission(['email::read']), async (req, res) => {
  try {
    const templates = await EmailTemplate.find({});
    res.status(200).json({ templates, success: true });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// Get email configuration (alternative endpoint)
router.get('/api/v1/email/config', requirePermission(['email::read']), async (req, res) => {
  try {
    const emailConfig = await Email.findOne();
    res.status(200).json({ emailConfig, success: true });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
});

// ==================== EXPORTS ====================

module.exports = {
  router,
  sendAssignedEmail,
  sendComment,
  sendTicketCreate,
  sendTicketStatus
};