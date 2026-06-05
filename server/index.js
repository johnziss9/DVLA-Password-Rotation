require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));

// Auth routes (public — no auth required)
app.use('/auth', require('./routes/auth'));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected API routes
const { requireAuth } = require('./middleware/auth');
app.use('/api/dvla', requireAuth, require('./routes/dvla'));

// In development, redirect root to Vite dev server
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => res.redirect('http://localhost:5173'));
}

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
