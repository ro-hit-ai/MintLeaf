// apps/api/src/lib/session.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

function extractToken(authHeader) {
  if (!authHeader) return null;
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();
}

// apps/api/src/lib/session.js
async function checkSession(req) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) return null;

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.warn("checkSession → Invalid/expired token:", err.message);
      return null;
    }

    const { userId, imap_enabled } = decoded;
    if (!userId) return null;

    console.log("checkSession → Decoded JWT:", { userId, imap_enabled });

    // Validate session in DB
    const session = await Session.findOne({
      sessionToken: token,
      userId,
      expires: { $gt: new Date() }
    }).lean();

    if (!session) {
      console.log("checkSession → Session not found or expired in DB");
      return null;
    }

    const user = await User.findById(userId).select('isAdmin email name').lean();
    if (!user) return null;

    const userData = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
      imap_enabled: !!imap_enabled
    };

    // CRITICAL: SET req.user
    req.user = userData;

    console.log("checkSession → FINAL userData with imap_enabled:", userData.imap_enabled);
    return userData;
  } catch (err) {
    console.error("checkSession error:", err.message);
    return null;
  }
}
async function attachUser(req, res, next) {
  req.user = null;
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next();
    }

    if (!decoded.userId) return next();

    const user = await User.findById(decoded.userId).select('isAdmin email name').lean();
    if (!user) return next();

    req.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
    };

    console.log(`attachUser → User attached: ${req.user.email}`);
  } catch (err) {
    console.error("attachUser error:", err);
  }
  next();
}

async function requireAuthJWT(req, res, next) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const user = await User.findById(decoded.userId).select('isAdmin');
    if (!user) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("requireAuthJWT error:", err);
    return res.status(401).json({ message: "Unauthorized", success: false });
  }
}

module.exports = {
  checkSession,
  attachUser,
  requireAuthJWT
};