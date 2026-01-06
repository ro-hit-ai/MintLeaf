// apps/api/models/OpenIdConfig.js

const mongoose = require('mongoose');

const openIdConfigSchema = new mongoose.Schema(
  {
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
    issuer: {
      type: String,
      required: true,
      trim: true,
    },
    jwtSecret: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OpenIdConfig', openIdConfigSchema);
