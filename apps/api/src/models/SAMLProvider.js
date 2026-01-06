// apps/api/models/SAMLProvider.js

const mongoose = require('mongoose');

const samlProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // each provider has a unique name
    },
    entryPoint: {
      type: String,
      required: true,
      trim: true, // SAML login URL / IdP endpoint
    },
    issuer: {
      type: String,
      required: true,
      trim: true, // entity ID for your app (SP)
    },
    cert: {
      type: String,
      required: true, // IdP X.509 certificate
    },
    logoutUrl: {
      type: String,
      default: '',
      trim: true,
    },
    audience: {
      type: String,
      default: '',
      trim: true, // expected audience (optional, used in some IdPs)
    },
    attributeMapping: {
      // map SAML attributes to your app’s fields
      email: { type: String, default: 'email' },
      firstName: { type: String, default: 'givenName' },
      lastName: { type: String, default: 'sn' },
      role: { type: String, default: 'role' },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SAMLProvider', samlProviderSchema);




