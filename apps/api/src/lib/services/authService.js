// services/authService.js
const { google } = require("googleapis");
const EmailQueue = require("../../models/EmailQueue");
const redisClient = require("../../lib/redisClient");

class AuthService {
static async getValidAccessToken(queue) {
  if (queue.serviceType !== "gmail") {
    throw new Error("Access token is only required for Gmail service type");
  }

  if (!queue.refreshToken) {
    throw new Error("No refresh token found. Please re-authorize Gmail with prompt=consent");
  }

  const redisKey = `gmail:accessToken:${queue._id}`;

  // Check expiry properly
  const notExpired = queue.tokenExpiry && Date.now() < new Date(queue.tokenExpiry).getTime();

  // Try Redis only if still valid
  if (notExpired) {
    const cachedToken = await redisClient.get(redisKey);
    if (cachedToken) {
      return cachedToken;
    }
  }

  // Setup OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    queue.clientId,
    queue.clientSecret,
    queue.redirectUri
  );

  oAuth2Client.setCredentials({
    refresh_token: queue.refreshToken,
  });

  // Always refresh if expired
  let token = queue.accessToken;
  if (!notExpired) {
    const newAccessToken = await oAuth2Client.getAccessToken();
    token = newAccessToken?.token || newAccessToken;
    if (!token) throw new Error("Failed to refresh Gmail access token");

    const expiry = Date.now() + 3600 * 1000; // 1h

    // Update Mongo
    await EmailQueue.findByIdAndUpdate(queue._id, {
      accessToken: token,
      tokenExpiry: expiry,
    });

    // Update Redis
    await redisClient.setEx(redisKey, 3600, token);
  } else {
    // Cache DB token in Redis
    await redisClient.setEx(redisKey, 3600, token);
  }

  return token;
}


  static generateXOAuth2Token(username, accessToken) {
    return Buffer.from(
      `user=${username}\u0001auth=Bearer ${accessToken}\u0001\u0001`
    ).toString("base64");
  }

static async getEmailConfig(queue) {
  if (queue.serviceType === "gmail") {
    const accessToken = await this.getValidAccessToken(queue);

    const xoauth2 = this.generateXOAuth2Token(queue.username, accessToken);

    // 🔎 Debug log (remove in prod)
    console.log("📩 IMAP Config for Gmail:", {
      user: queue.username,
      host: queue.hostname,
      port: 993,
      tls: true,
      xoauth2: xoauth2 ? "[token generated]" : null,
      expiry: queue.tokenExpiry,
    });

    return {
      user: queue.username,
      host: queue.hostname,
      port: 993,
      tls: true,
      xoauth2,
      tlsOptions: { rejectUnauthorized: false, servername: queue.hostname },
    };
  }

  if (queue.serviceType === "other") {
    // 🔎 Debug log (remove in prod)
    console.log("📩 IMAP Config for Other:", {
      user: queue.username,
      host: queue.hostname,
      port: queue.tls ? 993 : 143,
      tls: queue.tls || false,
    });

    return {
      user: queue.username,
      password: queue.password,
      host: queue.hostname,
      port: queue.tls ? 993 : 143,
      tls: queue.tls || false,
      tlsOptions: { rejectUnauthorized: false, servername: queue.hostname },
    };
  }

  throw new Error(`Unsupported service type: ${queue.serviceType}`);
}

}

module.exports = AuthService;
