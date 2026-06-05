function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  req.session.returnUrl = req.originalUrl;
  res.redirect('/auth/login');
}

module.exports = { requireAuth };
