const mongoose = require('mongoose');
const ImapEmail = require('./models/ImapEmail'); // adjust path
const Ticket = require('./models/Ticket');
const User = require('./models/User'); // to get a user ID
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/peppermint", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('Connected to MongoDB');

  // Get a user ID for createdBy field
  const user = await User.findOne(); // pick any existing user
  if (!user) {
    console.error("No users found in DB. Please create a user first.");
    return mongoose.disconnect();
  }

  const createdById = user._id;

  // Sample test emails
  const testEmails = [
    {
      from: 'alice@example.com',
      subject: 'Test Email 1',
      body: 'This is the first test email.',
      html: '<p>This is the first test email.</p>',
      text: 'This is the first test email.',
    },
    {
      from: 'bob@example.com',
      subject: 'Re: Ticket #12345678',
      body: 'This is a reply to ticket #12345678',
      html: '<p>This is a reply to ticket #12345678</p>',
      text: 'This is a reply to ticket #12345678',
    }
  ];

  for (const email of testEmails) {
    const imapEmail = await ImapEmail.create(email);

    // Auto-generate a Ticket for non-replies
    if (!email.subject.toLowerCase().startsWith('re:')) {
      const ticketCount = await Ticket.countDocuments();
      const ticketNumber = `TKT-${String(ticketCount + 1).padStart(6, '0')}`;

      await Ticket.create({
        Number: ticketNumber,
        email: email.from,
        name: email.from.split('@')[0],
        title: email.subject,
        isComplete: false,
        priority: 'low',
        fromImap: true,
        detail: email.html,
        createdBy: createdById, // ✅ include this
      });
    }

    console.log(`Inserted email from ${email.from}`);
  }

  console.log('Test emails inserted successfully');
  mongoose.disconnect();
}

main().catch(err => console.error(err));
