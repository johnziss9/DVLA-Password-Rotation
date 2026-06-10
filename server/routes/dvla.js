const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

const SPECIAL_CHARS = '^$*.[]{}()?-"!@#%&/\\,><\':;_~`';

function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = SPECIAL_CHARS;
  const all = upper + lower + digits + special;

  // Guarantee at least one of each required character type
  const required = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    special[crypto.randomInt(special.length)],
  ];

  // Fill remaining 8 chars from full set (total length: 12)
  const rest = Array.from({ length: 8 }, () => all[crypto.randomInt(all.length)]);

  // Shuffle to avoid predictable positions
  const password = [...required, ...rest]
    .sort(() => crypto.randomInt(3) - 1)
    .join('');

  return password;
}

function getUrls(env) {
  if (env === 'production') {
    return {
      requestUrl: process.env.DVLA_PROD_REQUEST_URL,
      rotateUrl: process.env.DVLA_PROD_ROTATE_URL,
    };
  }
  return {
    requestUrl: process.env.DVLA_SANDBOX_REQUEST_URL,
    rotateUrl: process.env.DVLA_SANDBOX_ROTATE_URL,
  };
}

// POST /api/dvla/request-code
// Triggers DVLA to send a verification email
router.post('/request-code', async (req, res) => {
  const { env } = req.body;
  if (!env || !['production', 'sandbox'].includes(env)) {
    return res.status(400).send('Invalid environment');
  }

  const { requestUrl } = getUrls(env);

  try {
    const response = await axios.post(requestUrl, {
      userName: process.env.DVLA_USERNAME,
      email: process.env.DVLA_EMAIL,
    });
    console.log(`[${env}] DVLA request-code response:`, response.status, response.data);
    res.json({ ok: true });
  } catch (err) {
    const detail = err.response?.data ?? err.message;
    console.error('DVLA request-code error:', detail);
    res.status(502).send(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
});

// POST /api/dvla/rotate
// Rotates the password using the verification code
router.post('/rotate', async (req, res) => {
  const { env, code } = req.body;
  if (!env || !['production', 'sandbox'].includes(env)) {
    return res.status(400).send('Invalid environment');
  }
  if (!code) {
    return res.status(400).send('Verification code is required');
  }

  const { rotateUrl } = getUrls(env);
  const newPassword = generatePassword();

  try {
    await axios.post(
      rotateUrl,
      { userName: process.env.DVLA_USERNAME, verifyCode: code, newPassword },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // TODO Step 7: update Azure App Service env var with newPassword
    console.log(`[${env}] Password rotated successfully`);

    res.json({ ok: true });
  } catch (err) {
    const detail = err.response?.data ?? err.message;
    console.error('DVLA rotate error:', detail);
    res.status(502).send(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
});

module.exports = router;
