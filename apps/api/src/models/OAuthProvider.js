// apps/api/models/OAuthProvider.js

const mongoose = require('mongoose');

const oauthProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    clientId: {
      type: String,
      required: true,
      trim: true,
    },
    clientSecret: {
      type: String,
      trim: true,
    },
    redirectUri: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      default: '',
    },
    authorizationUrl: {
      type: String,
      default: '',
    },
    tokenUrl: {
      type: String,
      default: '',
    },
    userInfoUrl: {
      type: String,
      default: '',
    },
    tenantId: {
      type: String,
      default: '',
    },
    issuer: {
      type: String,
      default: '',
    },
    jwtSecret: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OAuthProvider', oauthProviderSchema);
