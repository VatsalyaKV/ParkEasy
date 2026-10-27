const buckets = new Map();

function helmetMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}

// Lightweight fallback limiter for single-instance academic/dev deployments.
// Set RATE_LIMIT_STORE=redis and plug a Redis-backed adapter here for multi-instance production.
function rateLimit({ windowMs = 60_000, max = 100, message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - bucket.count));
    if (bucket.count > max) {
      return res.status(429).json({ success: false, message });
    }
    next();
  };
}

function requireTrustedOrigin(allowedOrigins = []) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) return next();
    return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();

module.exports = { helmetMiddleware, rateLimit, requireTrustedOrigin };
