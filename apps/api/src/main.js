// ======================
// 🌱 ENV + BASE SETUP
// ======================
require("dotenv").config();
const path = require("path");

console.log("📍 Running main.js from:", process.cwd());
console.log("🔍 Loaded JWT_SECRET =", process.env.JWT_SECRET);

// Core dependencies
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");

// Utils / services
const { track } = require("./lib/hog");
const { attachUser } = require("./lib/session");
const { checkToken } = require("./lib/jwt");

// Route loader
const { registerRoutes } = require("./routes");
const { initSocket } = require("./socket");

// IMPORTANT: Don't import ImapService here yet - it will cause circular dependency
// We'll import it after socket.io is initialized

// ======================
// 🚀 APP INIT
// ======================
const app = express();
app.use(express.json());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));

app.use(attachUser);

// ======================
// 🔌 SOCKET.IO SERVER
// ======================
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// 🔥 SOCKET AUTH
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log("🔐 Socket token:", token);

  if (!token) return next(new Error("No token"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    console.error("❌ Socket auth failed:", err.message);
    return next(new Error("Invalid token"));
  }
});

// 🔥 Initialize socket with centralized handler
initSocket(io);

// 🔥 Make io available globally to routes
app.set("io", io);
global.io = io; // Also make available globally for easy access

// ======================
// 🔐 JWT MIDDLEWARE EXCLUSIONS
// ======================
const excludedPaths = [
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/user/register/external",
  "/api/v1/auth/password-reset",
  "/api/v1/auth/password-reset/code",
  "/api/v1/auth/password-reset/password",
  "/api/v1/auth/check",
  "/api/v1/auth/user/all",
  "/api/v1/auth/profile",
  "/api/v1/auth/user/:id/logout",
  "/api/v1/auth/profile",


  "/api/v1/user/all",

  // IMAP
  "/api/v1/imap/emails",
  "/api/v1/imap/fetch-emails",
  "/api/v1/imap/emails/:id",
  "/api/v1/imap/emails/move",
  "/api/v1/imap/test-connection",
  "/api/v1/imap/test-ports",
  "/api/v1/imap/priority-stats",

  "/api/v1/email-queue/create",
  "/api/v1/email-queue/all",
  "/api/v1/email-queue/delete",

  // TICKETS
  "/api/v1/ticket/create",
  "/api/v1/ticket/public/create",
  "/api/v1/ticket/:id",
  "/api/v1/ticket/tickets/open",
  "/api/v1/ticket/tickets/all",
  "/api/v1/ticket/tickets/user/open",
  "/api/v1/ticket/tickets/completed",
  "/api/v1/ticket/tickets/unassigned",
  "/api/v1/ticket/comment",
  "/api/v1/ticket/assign/:id",
  "/api/v1/ticket/status/update",
  "/api/v1/ticket/summary",
  "/api/v1/ticket/tickets/user/completed",

  // ETC
  "/api/v1/client/all",
  "/api/v1/email/config",
  "/api/v1/smtp/send-email",

  "/api/v1/imap/test-fetch",

"/api/v1/data/logs",
"/api/v1/role/all",
"/api/v1/config/email",
"/api/v1/webhook/all",
];

// JWT middleware
app.use((req, res, next) => {
  const cleanPath = req.path.replace(/\/+$/, "");

  const isExcluded = excludedPaths.some((pattern) => {
    if (!pattern.includes(":")) return cleanPath === pattern;

    const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, "([^/]+)") + "$");
    return regex.test(cleanPath);
  });

  if (isExcluded) return next();

  try {
    const bearer = req.headers.authorization?.split(" ")[1];
    if (!bearer) throw new Error("No token");

    checkToken(bearer);
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// ======================
// 📌 REGISTER ROUTES
// ======================
registerRoutes(app);

// Health endpoint
app.get("/", (req, res) => res.json({ healthy: true }));

// ======================
// 🚀 START SERVER
// ======================
async function start() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pp");
      console.log("✅ MongoDB connected");
    }

    // NOW import and set up ImapService after everything is initialized
    const { ImapService } = require("./lib/services/imap.service");
    // Set the socket instance
    ImapService.setSocketInstance(io);
    console.log("✅ Socket.io instance set in ImapService");


if (process.env.IMAP_AUTO_FETCH === "true") {
  cron.schedule("*/15 * * * *", () => {
    console.log("⏳ Cron: triggering IMAP fetch safely...");
    ImapService.fetchEmails("cron").catch((err) => {
      console.error("IMAP cron error:", err.message);
    });
  });

  console.log("⏳ IMAP Auto Fetch Scheduled (every 15 minutes)");
}

    const port = process.env.PORT || 5004;

    server.listen(port, () => {
      console.log(`🚀 Server + Socket.IO running on port ${port}`);
      console.log(`🌐 CORS enabled for: ${allowedOrigins.join(", ")}`);
      console.log(`🔌 Socket.IO ready for connections`);

      // Track event
      const client = track();
      client.capture({ event: "server_started", distinctId: "uuid" });
      client.shutdownAsync();
    });

  } catch (err) {
    console.error("❌ Server startup failed:", err);
    console.error("Error stack:", err.stack);
    process.exit(1);
  }
}

start();

module.exports = { io };