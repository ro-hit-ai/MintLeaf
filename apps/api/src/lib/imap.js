const { ImapService } = require('./services/imap.service');

async function getEmails() {
  try {
    await ImapService.fetchEmails();
    console.log('Email fetch completed');
  } catch (error) {
    console.error('An error occurred while fetching emails:', error);
  }
}

module.exports = { getEmails };
