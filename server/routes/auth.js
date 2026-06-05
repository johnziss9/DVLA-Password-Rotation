const express = require('express');
const router = express.Router();
const { getMsalClient, getAuthCodeUrl, acquireTokenByCode } = require('../msalClient');

// Redirect to Microsoft login
router.get('/login', async (req, res) => {
  try {
    const authUrl = await getAuthCodeUrl(req);
    res.redirect(authUrl);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Login failed');
  }
});

// Microsoft redirects here after login
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const tokenResponse = await acquireTokenByCode(req, code);

    req.session.account = tokenResponse.account;
    req.session.isAuthenticated = true;

    const returnUrl = req.session.returnUrl || '/';
    delete req.session.returnUrl;

    res.redirect(returnUrl);
  } catch (err) {
    console.error('Callback error:', err.message);
    console.error('Error details:', JSON.stringify(err, null, 2));
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent('http://localhost:3000')}`;
    res.redirect(logoutUrl);
  });
});

module.exports = router;
