const { AuthorizationCode } = require("simple-oauth2");

const oauthClients = {};

function getOAuthClient(providerConfig) {
  const { name } = providerConfig;
  if (!oauthClients[name]) {
    oauthClients[name] = new AuthorizationCode({
      client: {
        id: providerConfig.clientId,
        secret: providerConfig.clientSecret,
      },
      auth: {
        tokenHost: process.env.OAUTH_TOKEN_HOST,       // https://accounts.google.com
        tokenPath: process.env.OAUTH_TOKEN_PATH,       // /oauth2/v4/token
        authorizePath: process.env.OAUTH_AUTHORIZE_PATH, // /o/oauth2/v2/auth
      },
    });
  }
  return oauthClients[name];
}

module.exports = { getOAuthClient };
