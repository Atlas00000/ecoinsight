const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: { message: 'username, email and password are required' } });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (exists) {
      return res.status(409).json({ success: false, error: { message: 'User already exists' } });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = await User.create({ username, email, password: hashed });

    return res.status(201).json({ success: true, data: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Registration failed' } });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { message: 'email and password are required' } });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: { message: 'Server configuration error' } });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
    return res.json({ success: true, data: { token } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Login failed' } });
  }
});

module.exports = router;


