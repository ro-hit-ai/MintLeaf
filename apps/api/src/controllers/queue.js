const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch'); // Add this: npm install node-fetch
const { track } = require('../lib/hog');
const EmailQueue = require('../models/EmailQueue');
const redisClient = require('../lib/redisClient');

const router = express.Router();

async function tracking(event, properties) {
  const client = track();
  client.capture({
    event: event,
    properties: properties,
    distinctId: "uuid",
  });
  client.shutdownAsync();
}

// OAuth configuration for different providers
const OAUTH_CONFIG = {
  gmail: {
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://mail.google.com', // Full Gmail access
    clientType: 'google' // For google-auth-library
  },
  outlook: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access',
    clientType: 'microsoft' // For fetch-based OAuth
  }
};

// Create a new email queue
router.post("/create", async (req, res) => {
  try {
    const {
      name,        // Queue name
      username,    // Email address
      password,    // Password
      hostname,    // SMTP/IMAP server (e.g. mail.grssl.net)
      tls,         // true/false
      serviceType  // gmail | outlook | custom
    } = req.body;

    // Validate serviceType
    if (!['gmail', 'outlook', 'custom'].includes(serviceType)) {
      return res.status(400).send({
        success: false,
        message: "Invalid serviceType. Must be 'gmail', 'outlook', or 'custom'."
      });
    }

    // Create new EmailQueue document
    const mailbox = await EmailQueue.create({
      name,
      username,
      password,
      hostname: serviceType === 'custom' ? hostname : (serviceType === 'outlook' ? 'outlook.office365.com' : hostname),
      tls: tls ?? (serviceType === 'custom' ? true : false),
      serviceType
    });

    console.log(`📧 Created ${serviceType} queue for ${username}`);

    // Handle Gmail/Outlook (OAuth required)
    if (serviceType === "gmail" || serviceType === "outlook") {
      const config = OAUTH_CONFIG[serviceType];
      let authorizeUrl;

      if (serviceType === "gmail") {
        const google = new OAuth2Client(req.body.clientId, req.body.clientSecret, req.body.redirectUri);
        authorizeUrl = google.generateAuthUrl({
          access_type: "offline",
          prompt: "consent",
          scope: [config.scope],
          state: mailbox._id.toString(),
        });
      } else {
        authorizeUrl = `${config.authUrl}?` +
          `client_id=${req.body.clientId}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(req.body.redirectUri)}&` +
          `scope=${encodeURIComponent(config.scope)}&` +
          `response_mode=query&` +
          `state=${mailbox._id.toString()}&` +
          `prompt=consent`;
      }

      return res.status(200).send({
        success: true,
        message: `${serviceType.toUpperCase()} IMAP provider created!`,
        authorizeUrl,
        queueId: mailbox._id,
      });
    }

    // Handle Custom SMTP/IMAP
    if (serviceType === "custom") {
      return res.status(200).send({
        success: true,
        message: "Custom SMTP/IMAP provider created!",
        queueId: mailbox._id
      });
    }

  } catch (error) {
    console.error("❌ Error creating email queue:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Generate OAuth URL for a specific mailbox
router.get("/generate-oauth-url/:mailboxId", async (req, res) => {
  try {
    const { mailboxId } = req.params;
    const mailbox = await EmailQueue.findById(mailboxId);
    if (!mailbox) {
      return res.status(404).send({ success: false, message: "Mailbox not found" });
    }

    if (!mailbox.redirectUri) {
      return res.status(400).send({
        success: false,
        message: "Redirect URI is missing for this mailbox."
      });
    }

    const { serviceType, clientId, clientSecret, redirectUri } = mailbox;
    const config = OAUTH_CONFIG[serviceType];

    let url;

    if (serviceType === "gmail") {
      const google = new OAuth2Client(clientId, clientSecret, redirectUri);
      url = google.generateAuthUrl({
        access_type: "offline",
        scope: [config.scope],
        prompt: "consent",
        state: mailboxId
      });
    } else if (serviceType === "outlook") {
      // Build Microsoft OAuth URL
      url = `${config.authUrl}?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(config.scope)}&` +
        `response_mode=query&` +
        `state=${mailboxId}&` +
        `prompt=consent`;
    } else {
      return res.status(400).send({ success: false, message: "Unsupported serviceType for OAuth" });
    }

    res.status(200).send({ success: true, url });
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

router.get("/oauth", async (req, res) => {
  let mailbox; // Define mailbox at the top to ensure it's always defined
  try {
    const { code, state, error, error_description } = req.query;
    const mailboxId = state;

    if (error) {
      return res.status(400).send({
        success: false,
        message: `OAuth error: ${error} - ${error_description}`
      });
    }

    if (!mailboxId) {
      return res.status(400).send({ success: false, message: "Missing mailbox ID (state parameter)" });
    }

    mailbox = await EmailQueue.findById(mailboxId);
    if (!mailbox) {
      return res.status(404).send({ success: false, message: "Mailbox not found" });
    }

    const { serviceType, clientId, clientSecret, redirectUri } = mailbox;
    const config = OAUTH_CONFIG[serviceType];

    let tokens;

    if (serviceType === "gmail") {
      const google = new OAuth2Client(clientId, clientSecret, redirectUri);
      const { tokens: gmailTokens } = await google.getToken({
        code,
        redirect_uri: redirectUri,
      });
      tokens = gmailTokens;
      console.log("🔑 Gmail token response:", tokens);
    } else if (serviceType === "outlook") {
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: config.scope
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData.error_description}`);
      }

      tokens = await tokenResponse.json();
      console.log("🔑 Outlook token response:", tokens);
    } else {
      return res.status(400).send({ success: false, message: "Unsupported serviceType for OAuth" });
    }

    const { access_token, refresh_token, expires_in } = tokens;
    const expiryDate = expires_in ? new Date(Date.now() + (expires_in * 1000)) : null;
    const refreshTokenToStore = refresh_token || mailbox.refreshToken;

    if (!refreshTokenToStore) {
      console.warn("⚠️ No refresh_token available! User must re-auth with prompt=consent.");
    }

    await EmailQueue.findByIdAndUpdate(mailboxId, {
      refreshToken: refreshTokenToStore,
      accessToken: access_token,
      tokenExpiry: expiryDate,
      serviceType: serviceType,
    });

    if (access_token && expiryDate) {
      const ttl = Math.floor((expiryDate - new Date()) / 1000);
      await redisClient.setEx(
        `mailbox:${mailboxId}:tokens`,
        Math.max(1, ttl),
        JSON.stringify({
          refreshToken: refreshTokenToStore,
          accessToken: access_token,
          expiryDate: expiryDate.toISOString()
        })
      );
    }

    res.status(200).send({
      success: true,
      message: `${serviceType.toUpperCase()} tokens stored successfully! IMAP/SMTP ready.`,
      queueId: mailboxId,
      tokens: { access_token: '***HIDDEN***', refresh_token: refresh_token ? '***HIDDEN***' : null }
    });
  } catch (error) {
    console.error(`❌ Error in OAuth callback for ${mailbox?.serviceType || 'unknown'}:`, error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all email queues
router.get("/all", async (req, res) => {
  try {
    const queues = await EmailQueue.find({})
      .select('id name serviceType active username hostname tls clientId redirectUri lastScanned tokenExpiry')
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      queues: queues,
    });
  } catch (error) {
    console.error("Error fetching email queues:", error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Delete an email queue
router.delete("/delete", async (req, res) => {
  try {
    const { id } = req.body;

    const result = await EmailQueue.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).send({
        success: false,
        message: "Email queue not found"
      });
    }

    // Clear Redis cache
    await redisClient.del(`mailbox:${id}:tokens`);

    res.status(200).send({
      success: true,
      message: "Email queue deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting email queue:", error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Test IMAP connection for a queue
router.post("/test-connection", async (req, res) => {
  try {
    const { queueId } = req.body;
    const queue = await EmailQueue.findById(queueId);
    if (!queue) {
      return res.status(404).send({ success: false, message: "Queue not found" });
    }

    const ImapService = require('./imap'); // Adjust path to your ImapService
    const imapConfig = await ImapService.ImapService.getImapConfig(queue);

    const connection = await ImapSimple.connect({ imap: imapConfig });
    await connection.openBox('INBOX');
    connection.end();

    res.status(200).send({
      success: true,
      message: `IMAP connection successful for ${queue.serviceType}: ${queue.username}`
    });

  } catch (error) {
    console.error("IMAP test connection failed:", error);
    res.status(500).send({
      success: false,
      message: "IMAP connection test failed",
      error: error.message
    });
  }
});

module.exports = router;