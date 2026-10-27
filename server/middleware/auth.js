const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'parkeasy_session';

const parseCookies = (header = '') => Object.fromEntries(
  header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    if (index < 0) return [part, ''];
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  })
);

const getBearerToken = (header = '') => {
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
};

const getTokenFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[COOKIE_NAME] || getBearerToken(req.headers.authorization || '');
};

const verifyToken = async (token) => {
  if (!token || !process.env.JWT_SECRET) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) return null;
  return user;
};

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const user = await verifyToken(token);
    if (!user) return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired session' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired session' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to access this resource.' });
  }
  next();
};

module.exports = { protect, authorize, verifyToken, getBearerToken, getTokenFromRequest, COOKIE_NAME };
