// Assuming you have defined Mongoose models for each config:
const OpenIdConfig = require('../models/OpenIdConfig');
const OAuthProvider = require('../models/OAuthProvider');
const SAMLProvider = require('../models/SAMLProvider');

async function getOidcConfig() {
  const config = await OpenIdConfig.findOne();
  if (!config) {
    throw new Error('Config not found in the database');
  }
  return config;
}

async function getOAuthProvider() {
  const provider = await OAuthProvider.findOne();
  if (!provider) {
    throw new Error('OAuth provider not found');
  }
  return provider;
}

async function getSAMLProvider(providerName) {
  const provider = await SAMLProvider.findOne({ name: providerName });
  if (!provider) {
    throw new Error(`SAML provider ${providerName} not found`);
  }
  return provider;
}

module.exports = {
  getOidcConfig,
  getOAuthProvider,
  getSAMLProvider,
};
