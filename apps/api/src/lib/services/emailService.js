// emailService.js
const { MailService } = require('./smtp.service');
const EmailQueue = require('../../models/EmailQueue');

async function sendComment(comment, title, ticketId, recipient) {
  try {
    console.log('Attempting to send comment email for ticket:', ticketId);
    const queue = await EmailQueue.findOne({ active: true, serviceType: 'custom' }); // Changed to custom
    if (!queue) {
      console.error('No active custom queue configured');
      throw new Error("No active custom queue configured");
    }
    console.log('Found queue:', queue._id, 'for service:', queue.serviceType);

    const subject = `Ticket #${ticketId}: ${title}`;
    const html = `
      <h3>${title}</h3>
      <p><b>Ticket ID:</b> ${ticketId}</p>
      <p>${comment}</p>
    `;

    const mail = await MailService.sendEmail({
      to: recipient,
      subject,
      text: comment,
      html,
      queue,
    });

    console.log("📧 Email sent:", mail.messageId);
    return true;
  } catch (err) {
    console.error("❌ Error sending comment email:", err.message, 'Stack:', err.stack);
    return false;
  }
}

module.exports = { sendComment };