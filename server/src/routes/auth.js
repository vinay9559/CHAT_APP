import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Helper
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  // Set JWT in HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.req_body || req.body; // handle some raw parses

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Check username rules
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({ message: 'Username must be between 3 and 20 characters long' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user exists
    const userExists = await User.findOne({ username: trimmedUsername });
    if (userExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Create user
    const user = await User.create({
      username: trimmedUsername,
      password,
    });

    if (user) {
      generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ username: trimmedUsername });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    generateToken(res, user._id);
    res.json({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user & clear cookie
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    username: req.user.username,
    avatar: req.user.avatar,
  });
});

// @route   PUT /api/auth/avatar
// @desc    Update current user's profile avatar
router.put('/avatar', protect, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar image content is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatar;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('Update avatar error:', error.message);
    res.status(500).json({ message: 'Server error updating avatar' });
  }
});

export default router;
