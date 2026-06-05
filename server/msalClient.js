const msal = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: process.env.ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}`,
    clientSecret: process.env.ENTRA_CLIENT_SECRET,
  },
};

const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';
const SCOPES = ['openid', 'profile', 'email'];

let msalClient;

function getMsalClient() {
  if (!msalClient) {
    msalClient = new msal.ConfidentialClientApplication(msalConfig);
  }
  return msalClient;
}

async function getAuthCodeUrl(req) {
  const client = getMsalClient();
  const cryptoProvider = new msal.CryptoProvider();
  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

  req.session.pkceCodes = { verifier, challenge };

  const authCodeUrlParams = {
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
  };

  return client.getAuthCodeUrl(authCodeUrlParams);
}

async function acquireTokenByCode(req, code) {
  const client = getMsalClient();
  const tokenRequest = {
    code,
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
    codeVerifier: req.session.pkceCodes?.verifier,
  };
  return client.acquireTokenByCode(tokenRequest);
}

module.exports = { getMsalClient, getAuthCodeUrl, acquireTokenByCode };
