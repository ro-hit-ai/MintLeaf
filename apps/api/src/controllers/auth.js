// apps/api/src/routes/auth.js
require("dotenv").config();
console.log("🔑 Loaded JWT_SECRET:", process.env.JWT_SECRET);
if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR: JWT_SECRET is missing! Check your .env file.");
}
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const LRUCache = require('lru-cache');
const axios = require('axios');
const { generators } = require('openid-client');
const { AuthorizationCode } = require('simple-oauth2');
const redisClient = require('../lib/redisClient');
const { getOAuthProvider, getOidcConfig } = require('../lib/auth');
const { track } = require('../lib/hog');
const { forgotPassword } = require('../lib/nodemailer/auth/forgot-password');
const { requirePermission } = require('../lib/roles');
const { checkSession,requireAuthJWT } = require('../lib/session');
const { createSession } = require('../lib/sessionStore');
const { getOAuthClient } = require('../lib/utils/oauth_client');
const { getOidcClient } = require('../lib/utils/oidc_client');
const User = require('../models/User');
const Session = require('../models/Session');
const Role = require('../models/Role');
const PasswordResetToken = require('../models/PasswordResetToken');
const Config = require('../models/Config');
const Notification = require('../models/Notification');
const Note = require('../models/Note');

const router = express.Router();

const options = { max: 500, ttl: 1000 * 60 * 5 };
const cache = new LRUCache(options);

async function getUserEmails(token) {
  const res = await axios.get('https://api.github.com/user/emails', {
    headers: { Authorization: `token ${token}` },
  });
  const primaryEmail = res.data.find((email) => email.primary);
  return primaryEmail ? primaryEmail.email : null;
}

function generateRandomPassword(length) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

async function tracking(event, properties) {
  const client = track();
  client.capture({
    event,
    properties,
    distinctId: "uuid",
  });
}

// User Registration (admin only)
router.post('/register', async (req, res) => {
  try {
    const { email, password, admin, name, agent } = req.body;
    const bearer = req.headers.authorization?.split(" ")[1];
    console.log('🔍 Register: Bearer token:', !!bearer);

    if (!bearer) {
      console.log('❌ Register: No token provided');
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const session = await checkSession(req);
    console.log('🔍 Register: Session:', session, 'isAdmin:', session?.isAdmin);

    // Allow registration if user is found and isAdmin is true, even without a session
    if (!session || !session.isAdmin) {
      console.log('❌ Register: Unauthorized, session:', !!session, 'isAdmin:', session?.isAdmin);
      if (session && !session.isAdmin) {
        console.log('❌ Register: User is not an admin');
      }
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (await User.findOne({ email })) {
      console.log('❌ Register: Email exists:', email);
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashed, name, isAdmin: admin || false, isAgent: agent || false });
    await newUser.save();
    console.log('✅ Register: User created:', newUser.name, 'isAdmin:', newUser.isAdmin, 'isAgent:', newUser.isAgent);

    await tracking('user_registered', { userId: newUser._id });
    res.json({ success: true, message: `User ${name} created successfully!` });
  } catch (err) {
    console.error('❌ Register error:', err.message, err);
    res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
});

// Login route (password)
router.post('/login', async (req, res) => {
  try {
    console.log("Incoming login body:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("Missing email/password");
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    console.log("User found?", !!user);

    if (!user || !user.password) {
      console.log("User not found or no password set");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid?", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Password mismatch");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ADD THIS: Check if any IMAP queue is active
    const EmailQueue = require('../models/EmailQueue'); // ← ADD THIS LINE
    const activeQueues = await EmailQueue.countDocuments({ active: true });
    const imap_enabled = activeQueues > 0;

    // Generate JWT with imap_enabled
    const token = await createSession(user._id, req.get('User-Agent'), req.ip);

    console.log("Token generated:", { id: user._id, isAdmin: user.isAdmin, imap_enabled });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isAgent: user.isAgent,
        language: user.language || 'en',
        ticket_created: user.notify_ticket_created,
        ticket_status_changed: user.notify_ticket_status_changed,
        ticket_comments: user.notify_ticket_comments,
        ticket_assigned: user.notify_ticket_assigned,
        firstLogin: user.firstLogin,
        external_user: user.external_user,
        imap_enabled // ← ADD THIS
      },
      imap_enabled, // ← ADD THIS
      success: true,
    });
  } catch (err) {
    console.error("Login error:", err.message, err);
    return res.status(500).json({ success: false, message: "Login error", error: err.message });
  }
});

// External user registration
router.post('/user/register/external', async (req, res) => {
  const { email, password, name, language, agent } = req.body; // Add agent field
  if (await User.findOne({ email })) {
    console.log('❌ External register: Email exists:', email);
    return res.status(400).json({ success: false, message: "Email already exists" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({
    email,
    password: hashed,
    name,
    isAdmin: false,
    isAgent: agent || false, // Set isAgent
    language,
    external_user: true,
    firstLogin: false,
  });
  await user.save();
  await tracking('user_registered_external', { userId: user._id });
  res.json({ success: true });
});

// External user registration
router.post('/user/register/external', async (req, res) => {
  const { email, password, name, language } = req.body;
  if (await User.findOne({ email })) {
    console.log('❌ External register: Email exists:', email);
    return res.status(400).json({ success: false, message: "Email already exists" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({
    email,
    password: hashed,
    name,
    isAdmin: false,
    language,
    external_user: true,
    firstLogin: false,
  });
  await user.save();
  await tracking('user_registered_external', { userId: user._id });
  res.json({ success: true });
});

// Forgot Password: send reset code
router.post('/password-reset', async (req, res) => {
  const { email, link } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    console.log('❌ Password reset: Invalid email:', email);
    return res.status(401).json({ success: false, message: "Invalid email" });
  }
  function generateRandomCode(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const code = generateRandomCode();
  const uuid = await PasswordResetToken.create({ userId: user._id, code: String(code) });
  forgotPassword(email, String(code), link, uuid._id);
  res.json({ success: true });
});

// Verify reset code
router.post('/password-reset/code', async (req, res) => {
  const { code, uuid } = req.body;
  const reset = await PasswordResetToken.findOne({ code: code, _id: uuid });
  if (!reset) {
    console.log('❌ Password reset code: Invalid code or UUID');
    return res.status(401).json({ success: false, message: "Invalid Code" });
  }
  res.json({ success: true });
});

// Reset password using code
router.post('/password-reset/password', async (req, res) => {
  const { password, code } = req.body;
  const reset = await PasswordResetToken.findOne({ code: code });
  if (!reset) {
    console.log('❌ Password reset: Invalid code');
    return res.status(401).json({ success: false, message: "Invalid Code" });
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: reset.userId }, { password: hashed });
  res.json({ success: true });
});

// Check SSO/OIDC/OAuth config
router.get('/check', async (req, res) => {
  console.log('🔎 /check: Checking SSO config');
  const authtype = await Config.findOne({ sso_active: true });
  if (!authtype) {
    console.log('🔎 /check: No active SSO config');
    return res.json({ success: true, message: "SSO not enabled", oauth: false });
  }
  const provider = authtype.sso_provider;
  const sso_active = authtype.sso_active;
  if (!sso_active) {
    console.log('🔎 /check: SSO not active');
    return res.json({ success: true, message: "SSO not enabled", oauth: false });
  }
  switch (provider) {
    case "oidc": {
      const config = await getOidcConfig();
      if (!config) {
        console.log('❌ /check: OIDC configuration not found');
        return res.status(500).json({ success: false, message: "OIDC configuration not found" });
      }
      const oidcClient = await getOidcClient(config);
      const codeVerifier = generators.codeVerifier();
      const codeChallenge = generators.codeChallenge(codeVerifier);
      const state = generators.state();

      await redisClient.setEx(`oidc:state:${state}`, 5 * 60, JSON.stringify({ codeVerifier }));
      console.log(`[OIDC START] Stored state ${state} in Redis`);

      const url = oidcClient.authorizationUrl({
        scope: "openid email profile",
        response_type: "code",
        redirect_uri: config.redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state: state,
      });
      res.json({ type: "oidc", success: true, url });
      break;
    }
    case "oauth": {
      const oauthProvider = await getOAuthProvider();
      if (!oauthProvider) {
        console.log('❌ /check: OAuth provider configuration not found');
        return res.status(500).json({ success: false, message: `OAuth provider ${provider} configuration not found` });
      }
      const client = getOAuthClient({ ...oauthProvider, name: oauthProvider.name });
      const uri = client.authorizeURL({ redirect_uri: oauthProvider.redirectUri, scope: oauthProvider.scope });
      res.json({ type: "oauth", success: true, url: uri });
      break;
    }
    default:
      console.log('❌ /check: Unknown provider:', provider);
      res.json({ success: false, message: `Unknown provider: ${provider}` });
      break;
  }
});

// OIDC callback
router.get('/oidc/callback', async (req, res) => {
  try {
    console.log('[OIDC CALLBACK] Request received:', req.query);
    const oidc = await getOidcConfig();
    if (!oidc) {
      console.log('❌ OIDC callback: Configuration not set');
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/login?error=oidc`);
    }

    const oidcClient = await getOidcClient(oidc);
    const params = oidcClient.callbackParams(req);

    if (params.iss === "undefined") {
      params.iss = oidc.issuer.replace(/\/\.well-known\/openid-configuration$/, "/");
    }

    const state = params.state;
    console.log('[OIDC CALLBACK] Looking for state in Redis:', state);

    const sessionDataString = await redisClient.get(`oidc:state:${state}`);
    if (!sessionDataString) {
      console.error('[OIDC CALLBACK] State not found in Redis:', state);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/login?error=oidc`);
    }

    const sessionData = JSON.parse(sessionDataString);
    const { codeVerifier } = sessionData;
    console.log('[OIDC CALLBACK] Found codeVerifier in Redis');

    if (!codeVerifier) {
      console.error('[OIDC CALLBACK] No codeVerifier found for state:', state);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/login?error=oidc`);
    }

    await redisClient.del(`oidc:state:${state}`);
    console.log('[OIDC CALLBACK] Deleted state from Redis:', state);

    let tokens = await oidcClient.callback(
      oidc.redirectUri,
      params,
      { code_verifier: codeVerifier, state }
    );

    const userInfo = await oidcClient.userinfo(tokens.access_token);
    let user = await User.findOne({ email: userInfo.email });
    await tracking("user_logged_in_oidc", {});

    if (!user) {
      user = await User.create({
        email: userInfo.email,
        password: await bcrypt.hash(generateRandomPassword(12), 10),
        name: userInfo.name || "New User",
        isAdmin: false,
        language: "en",
        external_user: false,
        firstLogin: true,
      });
    }

    const token = await createSession(user._id, req.get('User-Agent'), req.ip);
    console.log('✅ OIDC callback: Token generated:', token);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/auth/login?token=${token}&onboarding=${user.firstLogin}`);
  } catch (error) {
    console.error("❌ OIDC callback error:", error.message, error);
    return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/login?error=oidc`);
  }
});

// OAuth callback
router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  const oauthProvider = await getOAuthProvider();
  if (!oauthProvider) {
    console.log('❌ OAuth callback: Provider configuration not found');
    return res.status(500).json({ success: false, message: `OAuth provider configuration not found` });
  }
  const client = new AuthorizationCode({
    client: { id: oauthProvider.clientId, secret: oauthProvider.clientSecret },
    auth: { tokenHost: oauthProvider.authorizationUrl },
  });
  const tokenParams = { code, redirect_uri: oauthProvider.redirectUri };
  try {
    const fetch_token = await client.getToken(tokenParams);
    const access_token = fetch_token.token.access_token;
    const userInfoResponse = await axios.get(oauthProvider.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const email = oauthProvider.name === "github" ? await getUserEmails(access_token) : userInfoResponse.data.email;
    let user = await User.findOne({ email });
    if (!user) {
      console.log('❌ OAuth callback: User not found for email:', email);
      return res.json({ success: false, message: "Invalid email" });
    }
    const token = await createSession(user._id, req.get('User-Agent'), req.ip);
    console.log('✅ OAuth callback: Token generated:', token);
    await tracking("user_logged_in_oauth", {});
    res.json({ token, onboarding: user.firstLogin, success: true });
  } catch (error) {
    console.error("❌ OAuth callback error:", error.message, error);
    res.status(403).json({ success: false, message: "OAuth callback error", error: error.message });
  }
});

// Delete user (admin-protected)
router.delete('/user/:id', async (req, res) => {
  const session = await checkSession(req);
  if (!session || !session.isAdmin) {
    console.log('❌ Delete user: Unauthorized, session:', !!session, 'isAdmin:', session?.isAdmin);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { id } = req.params;
  const userToDelete = await User.findById(id);
  if (!userToDelete) {
    console.log('❌ Delete user: User not found:', id);
    return res.status(404).json({ success: false, message: "User not found" });
  }
  if (userToDelete.isAdmin) {
    const adminCount = await User.countDocuments({ isAdmin: true });
    if (adminCount <= 1) {
      console.log('❌ Delete user: Cannot delete last admin');
      return res.status(400).json({ success: false, message: "Cannot delete the last admin account" });
    }
  }
  await Note.deleteMany({ userId: id });
  await Session.deleteMany({ userId: id });
  await Notification.deleteMany({ userId: id });
  await User.deleteOne({ _id: id });
  res.json({ success: true });
});

// User Profile
router.get('/profile', async (req, res) => {
  try {
    const session = await checkSession(req);
    if (!session) {
      console.log("Profile: No valid session");
      return res.status(401).json({ success: false, message: "Unauthorized - invalid session" });
    }

    const fullUser = await User.findById(session.id).populate('roles');
    if (!fullUser) {
      console.log("Profile: User not found for ID:", session.id);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ADD THIS: Check IMAP enabled status
    const EmailQueue = require('../models/EmailQueue');
    const activeQueues = await EmailQueue.countDocuments({ active: true });
    const imap_enabled = activeQueues > 0;

    const config = await Config.findOne();
    const notifications = await Notification.find({ userId: session.id }).sort({ createdAt: -1 });

    const data = {
      id: fullUser._id,
      email: fullUser.email,
      name: fullUser.name,
      isAdmin: fullUser.isAdmin,
      isAgent: fullUser.isAgent,
      language: fullUser.language || 'en',
      ticket_created: fullUser.notify_ticket_created,
      ticket_status_changed: fullUser.notify_ticket_status_changed,
      ticket_comments: fullUser.notify_ticket_comments,
      ticket_assigned: fullUser.notify_ticket_assigned,
      sso_status: config && config.sso_active,
      version: config && config.client_version,
      notifications,
      external_user: fullUser.external_user,
      firstLogin: fullUser.firstLogin,
      imap_enabled // ← ADD THIS
    };

    console.log('Profile: Data returned with imap_enabled:', imap_enabled);
    await tracking("user_profile", {});
      res.json({
       user: data,
       token: req.headers.authorization?.split(" ")[1],  // ← ADD THIS LINE
       imap_enabled,
      success: true
     });
  } catch (error) {
    console.error("Profile endpoint error:", error.message, error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});
// Reset own password
router.post('/reset-password', async (req, res) => {
  const session = await checkSession(req);
  if (!session) {
    console.log('❌ Reset password: No valid session');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { password } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: session.id }, { password: hashedPass });
  res.json({ success: true });
});

// Reset password by admin
router.post('/admin/reset-password', async (req, res) => {
  const session = await checkSession(req);
  if (!session || !session.isAdmin) {
    console.log('❌ Admin reset password: Unauthorized, session:', !!session, 'isAdmin:', session?.isAdmin);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { password, user: userId } = req.body;
  const hashedPass = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: userId }, { password: hashedPass });
  res.json({ success: true });
});

// Update profile/config
router.put('/profile', async (req, res) => {
  const session = await checkSession(req);
  if (!session) {
    console.log('❌ Update profile: No valid session');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { name, email, language } = req.body;
  const user = await User.findByIdAndUpdate(
    session.id,
    { name, email, language },
    { new: true }
  );
  res.json({ user });
});

// Update email notification settings
router.put('/profile/notifcations/emails', async (req, res) => {
  const session = await checkSession(req);
  if (!session) {
    console.log('❌ Update notifications: No valid session');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { notify_ticket_created, notify_ticket_assigned, notify_ticket_comments, notify_ticket_status_changed } = req.body;
  const user = await User.findByIdAndUpdate(
    session.id,
    {
      notify_ticket_created,
      notify_ticket_assigned,
      notify_ticket_comments,
      notify_ticket_status_changed,
    },
    { new: true }
  );
  res.json({ user });
});

// Logout
router.get('/user/:id/logout', async (req, res) => {
  const session = await checkSession(req);
  if (!session) {
    console.log('❌ Logout: No valid session');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { id } = req.params;
  await Session.deleteMany({ userId: id });
  console.log('✅ Logout: Sessions deleted for user:', id);
  res.json({ success: true });
});

// Update user role (admin only)
router.put('/user/role', async (req, res) => {
  const session = await checkSession(req);
  if (!session || !session.isAdmin) {
    console.log('❌ Update role: Unauthorized, session:', !!session, 'isAdmin:', session?.isAdmin);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { id, role } = req.body;
  if (role === false) {
    const admins = await User.countDocuments({ isAdmin: true });
    if (admins.length === 1) {
      console.log('❌ Update role: Cannot remove last admin');
      return res.status(400).json({ success: false, message: "At least one admin required" });
    }
  }
  await User.updateOne({ _id: id }, { isAdmin: role });
  res.json({ success: true });
});

router.patch("/:id/first-login", async (req, res) => {
  const { id } = req.params;

  // Only the user themselves or admin can update
  if (req.user._id.toString() !== id && !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { firstLogin: false },
    { new: true }
  ).lean();

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ success: true, user });
});


// List sessions for current user
router.get('/sessions', async (req, res) => {
  const session = await checkSession(req);
  if (!session) {
    console.log('❌ Sessions: No valid session');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const sessions = await Session.find({ userId: session.id }).select('id userAgent ipAddress createdAt expires');
  console.log('✅ Sessions: Found:', sessions.length);
  res.json({ sessions });
});

// Delete specific session
router.delete('/sessions/:sessionId', async (req, res) => {
  const session = await checkSession(req);
  if (!session) {
    console.log('❌ Delete session: No valid session');
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { sessionId } = req.params;
  const sessionToDelete = await Session.findOne({ _id: sessionId, userId: session.id });
  if (!sessionToDelete) {
    console.log('❌ Delete session: Session not found:', sessionId);
    return res.status(404).json({ success: false, message: "Session not found" });
  }
  await Session.deleteOne({ _id: sessionId });
  console.log('✅ Delete session:', sessionId);
  res.json({ success: true });
});

router.get("/user/all", async (req, res) => {
  try {
    const user = await checkSession(req);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const users = await User.find({ isAgent: true }) // Only agents
      .select('id name email')
      .sort('name');

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// module.exports = { router,requireAuthJWT };
module.exports = router;