const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  sso_active: {
    type: Boolean,
    default: false
  },
  sso_provider: {
    type: String,
    enum: ['oidc', 'oauth', null],
    default: null
  },
  client_version: {
    type: String,
    default: '1.0.0'
  },
  roles_active: {
    type: Boolean,
    default: false
  }, 
  // OIDC Configuration
  oidc_issuer: String,
  oidc_clientId: String,
  oidc_clientSecret: String,
  oidc_redirectUri: String,
  // OAuth Configuration
  oauth_name: String,
  oauth_clientId: String,
  oauth_clientSecret: String,
  oauth_authorizationUrl: String,
  oauth_tokenUrl: String,
  oauth_userInfoUrl: String,
  oauth_redirectUri: String,
  oauth_scope: String
},
 {
  timestamps: true
});

// Ensure only one config document exists
configSchema.statics.getConfig = function() {
  return this.findOneAndUpdate(
    {},
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('Config', configSchema);