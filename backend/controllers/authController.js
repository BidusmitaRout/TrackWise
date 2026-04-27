const User = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
    });

    const token = signToken({ userId: user._id, email: user.email });
    return res.status(201).json({
      user: { email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user._id, email: user.email });
    return res.json({
      user: { email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function logout(req, res) {
  req.logout(function (err) {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.json({ ok: true });
    });
  });
}

async function registerSession(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.redirect('/register?error=Email and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.redirect('/register?error=User already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name,
    });

    req.login(user, function (err) {
      if (err) {
        console.error('Register session login error:', err);
        return res.redirect('/register?error=Unable to sign in');
      }
      return res.redirect('/dashboard');
    });
  } catch (error) {
    console.error('Register session error:', error);
    return res.redirect('/register?error=Server error');
  }
}

module.exports = { register, login, logout, registerSession };
