const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE_NAME } = require('../middleware/auth');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const setSessionCookie = (res, token) => {
  const options = cookieOptions();
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${Math.floor(options.maxAge / 1000)}`,
    `Path=${options.path}`,
    'HttpOnly',
    `SameSite=${options.sameSite}`,
  ];
  if (options.secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new user or owner
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Name, valid email and a password of at least 8 characters are required.' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Role can only be 'user' or 'owner' on self-registration
    const assignedRole = role === 'owner' ? 'owner' : 'user';

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: assignedRole,
      phone: phone || '',
      ecoPoints: assignedRole === 'user' ? 100 : 0,
    });

    const token = generateToken(user._id);
    setSessionCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ecoPoints: user.ecoPoints,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user / owner / admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    // Find user by email and explicitly include password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    setSessionCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ecoPoints: user.ecoPoints,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  const parts = [`${COOKIE_NAME}=`, 'Max-Age=0', 'Path=/', 'HttpOnly', `SameSite=${process.env.COOKIE_SAMESITE || 'lax'}`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ecoPoints: user.ecoPoints,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
