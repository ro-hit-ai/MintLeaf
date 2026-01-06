// apps/api/src/lib/sessionStore.js
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const EmailQueue = require('../models/EmailQueue'); // ← REQUIRED

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

async function createSession(userId, userAgent, ipAddress) {
  try {
    if (!JWT_SECRET) {
      console.error('createSession: JWT_SECRET not configured');
      throw new Error('JWT secret not configured');
    }

    // CHECK IF ANY ACTIVE IMAP QUEUE EXISTS
    const activeQueueCount = await EmailQueue.countDocuments({ active: true });
    const imap_enabled = activeQueueCount > 0;

    console.log('createSession → IMAP queues active:', activeQueueCount);
    console.log('createSession → imap_enabled:', imap_enabled);

    // ADD imap_enabled TO JWT PAYLOAD
    const token = jwt.sign(
      { userId, imap_enabled }, // ← CRITICAL: INCLUDE imap_enabled
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('createSession → Generated JWT with imap_enabled:', imap_enabled);

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const session = new Session({
      userId,
      sessionToken: token,
      expires,
      userAgent,
      ipAddress,
      createdAt: new Date(),
    });

    await session.save();
    console.log('createSession → Session saved in DB');

    return token;
  } catch (err) {
    console.error('createSession error:', err.message);
    throw err;
  }
}

async function deleteSession(sessionToken) {
  try {
    console.log('deleteSession → Deleting session:', sessionToken);
    const result = await Session.deleteOne({ sessionToken });
    console.log('deleteSession → Result:', result);
  } catch (err) {
    console.error('deleteSession error:', err.message);
    throw err;
  }
}

async function deleteAllUserSessions(userId) {
  try {
    console.log('deleteAllUserSessions → Deleting all for user:', userId);
    const result = await Session.deleteMany({ userId });
    console.log('deleteAllUserSessions → Result:', result);
  } catch (err) {
    console.error('deleteAllUserSessions error:', err.message);
    throw err;
  }
}

async function getUserSessions(userId) {
  try {
    console.log('getUserSessions → Fetching for user:', userId);
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 }).lean();
    console.log('getUserSessions → Found:', sessions.length);
    return sessions;
  } catch (err) {
    console.error('getUserSessions error:', err.message);
    throw err;
  }
}

module.exports = {
  createSession,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
};