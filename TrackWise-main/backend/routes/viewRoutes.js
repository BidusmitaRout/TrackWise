const express = require('express');
const passport = require('passport');
const router = express.Router();
const ensureSession = require('../middlewares/sessionAuth');
const { registerSession } = require('../controllers/authController');
const {
  renderLoginPage,
  renderRegisterPage,
  renderDashboardPage,
  logoutView,
} = require('../controllers/sessionController');

router.get('/', (req, res) => {
  return req.isAuthenticated && req.isAuthenticated() ? res.redirect('/dashboard') : res.redirect('/login');
});

router.get('/login', renderLoginPage);
router.get('/register', renderRegisterPage);
router.post('/register', registerSession);
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login?error=Invalid credentials',
  })
);
router.post('/logout', ensureSession, logoutView);
router.get('/dashboard', ensureSession, renderDashboardPage);

module.exports = router;
