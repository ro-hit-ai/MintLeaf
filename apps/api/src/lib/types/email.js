const EmailConfig = {
  user: String,
  host: String,
  port: Number,
  tls: Boolean,
  tlsOptions: {
    rejectUnauthorized: Boolean,
    servername: String
  },
  xoauth2: String, // Optional
  password: String // Optional
};

const EmailQueue = {
  serviceType: ["gmail", "other"], // Enum-like array for valid values
  id: String,
  username: String,
  hostname: String,
  password: String, // Optional
  clientId: String, // Optional
  clientSecret: String, // Optional
  refreshToken: String, // Optional
  accessToken: String, // Optional
  expiresIn: Number, // Optional
  tls: Boolean // Optional
};

module.exports = { EmailConfig, EmailQueue };