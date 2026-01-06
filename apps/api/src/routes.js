// const authRoutes = require("./controllers/auth").router;
const authRoutes = require("./controllers/auth");
const clientRoutes = require("./controllers/clients");
const configRoutes = require("./controllers/config");
const dataRoutes = require("./controllers/data");
const notebookRoutes = require("./controllers/notebook");
const emailQueueRoutes = require("./controllers/queue");
const roleRoutes = require("./controllers/roles");
const objectStoreRoutes = require("./controllers/storage");
const ticketRoutes = require("./controllers/ticket");
// const { router: emailRouter } = require('./lib/nodemailer/ticket/assigned');
const timeTrackingRoutes = require("./controllers/time");
const userRoutes = require("./controllers/users");
const webhookRoutes = require("./controllers/webhooks");
// const imapRoutes = require("../../lib/services/imap.service");
const { router: imapRouter } = require("./lib/services/imap.service");
const { router: smtpRouter } = require("./lib/services/smtp.service");
const { router: emailRouter } = require('./lib/nodemailer/ticket/email');
const { router: notificationRouter } = require('./lib/services/notifications/notification');
const { requireAuthJWT } = require("./lib/session");

function registerRoutes(app) {
  // Public routes (no JWT required)
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/imap", imapRouter);
  app.use("/api/v1/smtp", smtpRouter);
  app.use("/api/v1/email", emailRouter);
  app.use("/api/v1/email", notificationRouter);

  // Protected routes (JWT required)
  app.use("/api/v1/email-queue", emailQueueRoutes);
  app.use("/api/v1/data", requireAuthJWT, dataRoutes);
  app.use("/api/v1/ticket", ticketRoutes);
  app.use("/api/v1/user", requireAuthJWT, userRoutes);
  app.use("/api/v1/notebook", requireAuthJWT, notebookRoutes);
  app.use("/api/v1/client", requireAuthJWT, clientRoutes);
  app.use("/api/v1/webhook", webhookRoutes);
  app.use("/api/v1/config", configRoutes);
  app.use("/api/v1/time", requireAuthJWT, timeTrackingRoutes);
  app.use("/api/v1/storage", requireAuthJWT, objectStoreRoutes);
  app.use("/api/v1/role", roleRoutes);
}

module.exports = { registerRoutes };