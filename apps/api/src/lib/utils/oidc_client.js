const { Issuer } = require('openid-client');

let oidcClient = null;

async function getOidcClient(config) {
  if (!oidcClient) {
    const oidcIssuer = await Issuer.discover(config.issuer);
    oidcClient = new oidcIssuer.Client({
      client_id: config.clientId,
      redirect_uris: [config.redirectUri],
      response_types: ['code'],
      token_endpoint_auth_method: 'none', // adjust as needed
    });
  }
  return oidcClient;
}

module.exports = { getOidcClient };
