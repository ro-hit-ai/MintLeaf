// fix_existing_data.js
const mongoose = require('mongoose');
const EmailMessage = require('./models/EmailMessage');
const Ticket = require('./models/Ticket');

mongoose.connect('mongodb://localhost:27017/peppermint');

async function fixExistingData() {
  try {
    console.log('🔧 === FIXING EXISTING DATA ===');
    
    // 1. Fix emails - set unanalyzed ones to pending
    console.log('\n📧 Fixing EmailMessages...');
    const emailFixResult = await EmailMessage.updateMany(
      { 
        $or: [
          { sentiment_analyzed: { $exists: false } },
          { sentiment_analyzed: true, priority: { $nin: ['low', 'medium', 'high'] } }
        ]
      },
      {
        $set: {
          priority: 'pending',
          sentiment_analyzed: false
        }
      }
    );
    
    console.log(`📧 Updated ${emailFixResult.modifiedCount} EmailMessages to 'pending'`);
    
    // 2. Count pending emails
    const pendingEmails = await EmailMessage.countDocuments({
      priority: 'pending',
      sentiment_analyzed: false
    });
    console.log(`📊 Pending emails ready for Python: ${pendingEmails}`);
    
    // 3. Fix tickets - ensure sentiment_analyzed is set
    console.log('\n🎫 Fixing Tickets...');
    const ticketFixResult = await Ticket.updateMany(
      { 
        $or: [
          { sentiment_analyzed: { $exists: false } },
          { priority: { $nin: ['pending', 'low', 'medium', 'high', 'critical'] } }
        ]
      },
      {
        $set: {
          sentiment_analyzed: false,
          priority: 'pending' // Reset unanalyzed tickets to pending
        }
      }
    );
    
    console.log(`🎫 Updated ${ticketFixResult.modifiedCount} Tickets to 'pending'`);
    
    // 4. Count pending tickets
    const pendingTickets = await Ticket.countDocuments({
      priority: 'pending',
      sentiment_analyzed: false
    });
    console.log(`🎫 Pending tickets ready for Python: ${pendingTickets}`);
    
    // 5. Link existing tickets to emails (best effort)
    console.log('\n🔗 Linking existing tickets to emails...');
    const tickets = await Ticket.find({ fromImap: true, emailId: null }).limit(10);
    let linkedCount = 0;
    
    for (const ticket of tickets) {
      // Find matching email by email address and subject similarity
      const emailMatch = await EmailMessage.findOne({
        from: { $regex: ticket.email, $options: 'i' },
        subject: { $regex: ticket.title.substring(0, 50), $options: 'i' } // Partial match
      });
      
      if (emailMatch && !ticket.emailId) {
        await Ticket.updateOne(
          { _id: ticket._id },
          { $set: { emailId: emailMatch._id } }
        );
        
        // Also link back
        await EmailMessage.updateOne(
          { _id: emailMatch._id },
          { $set: { ticketId: ticket._id } }
        );
        
        linkedCount++;
        console.log(`🔗 Linked TKT-${ticket.number} <-> Email ${emailMatch._id}`);
      }
    }
    
    console.log(`🔗 Successfully linked ${linkedCount} ticket-email pairs`);
    
    console.log('\n✅ === DATA FIX COMPLETE ===');
    console.log('📋 Next steps:');
    console.log('1. Restart Node.js server');
    console.log('2. Start Python service: python email_worker.py');
    console.log('3. Send a test email to verify the flow');
    console.log('4. Check logs for processing');
    
  } catch (error) {
    console.error('❌ === FIX FAILED ===');
    console.error(error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixExistingData();