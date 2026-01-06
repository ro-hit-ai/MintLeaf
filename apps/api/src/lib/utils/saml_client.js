const { ServiceProvider, IdentityProvider } = require('samlify');

const samlProviders = {};

function getSamlProvider(providerConfig) {
  const { name } = providerConfig;
  if (!samlProviders[name]) {
    const sp = ServiceProvider({
      entityID: providerConfig.issuer,
      assertionConsumerService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: providerConfig.acsUrl,
        },
      ],
    });

    const idp = IdentityProvider({
      entityID: providerConfig.entryPoint,
      singleSignOnService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
          Location: providerConfig.ssoLoginUrl,
        },
      ],
      signingCert: providerConfig.cert,
    });

    samlProviders[name] = { sp, idp };
  }
  return samlProviders[name];
}

module.exports = getSamlProvider;
