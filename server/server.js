const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { helmetMiddleware, rateLimit, requireTrustedOrigin } = require('./middleware/security');
const { verifyToken, getTokenFromRequest } = require('./middleware/auth');
const { releaseExpiredReservations } = require('./services/parkingState');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const handoverRoutes = require('./routes/handoverRoutes');
const smartArrivalRoutes = require('./routes/smartArrivalRoutes');
const ecoParkRoutes = require('./routes/ecoParkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
});

app.disable('x-powered-by');
app.use((req, res, next) => { req.io = io; next(); });
app.use((req, res, next) => {
  try {
    const helmet = require('helmet');
    return helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    })(req, res, next);
  } catch {
    return helmetMiddleware(req, res, next);
  }
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(requireTrustedOrigin(allowedOrigins));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

const apiLimiter = rateLimit({ windowMs: 60_000, max: 180 });
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: 'Too many authentication attempts. Please wait and try again.' });
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'online' : 'degraded',
    service: 'ParkEasy Smart Parking Management API',
    version: '2.0.0',
    database: connected ? 'connected' : 'disconnected',
    ai: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
    timestamp: new Date(),
  });
});

app.get('/api/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ ready, database: ready ? 'connected' : 'disconnected' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/handover', handoverRoutes);
app.use('/api/smart-arrival', smartArrivalRoutes);
app.use('/api/ecopark', ecoParkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'API route not found' }));
app.use(errorHandler);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || getTokenFromRequest({ headers: socket.handshake.headers });
    const user = await verifyToken(token);
    if (!user) return next(new Error('Unauthorized Socket.IO connection'));
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Unauthorized Socket.IO connection'));
  }
});

io.on('connection', (socket) => {
  if (process.env.NODE_ENV !== 'production') console.log(`[Socket.io] Authenticated client connected: ${socket.id} (${socket.user.role})`);

  socket.on('joinLocation', async (locationId, ack) => {
    if (!mongoose.isValidObjectId(locationId)) return ack?.({ success: false, message: 'Invalid location ID' });
    socket.join(`location_${locationId}`);
    const ParkingSlot = require('./models/ParkingSlot');
    const slots = await ParkingSlot.find({ location: locationId }).sort({ floor: 1, slotNumber: 1 }).lean();
    socket.emit('locationSnapshot', { locationId, slots });
    ack?.({ success: true, count: slots.length });
  });

  socket.on('leaveLocation', (locationId, ack) => {
    socket.leave(`location_${locationId}`);
    ack?.({ success: true });
  });

  socket.on('requestLocationState', async (locationId, ack) => {
    if (!mongoose.isValidObjectId(locationId)) return ack?.({ success: false, message: 'Invalid location ID' });
    const ParkingSlot = require('./models/ParkingSlot');
    const slots = await ParkingSlot.find({ location: locationId }).sort({ floor: 1, slotNumber: 1 }).lean();
    socket.emit('locationSnapshot', { locationId, slots });
    ack?.({ success: true, count: slots.length });
  });

  socket.on('disconnect', (reason) => {
    if (process.env.NODE_ENV !== 'production') console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
  });
});

let cleanupTimer;

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters long.');
  }

  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`ParkEasy server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Socket.IO: enabled with authenticated connections`);
  });

  cleanupTimer = setInterval(() => releaseExpiredReservations(io), 30_000);
  cleanupTimer.unref();
  await releaseExpiredReservations(io);
}

async function shutdown(signal) {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);
  if (cleanupTimer) clearInterval(cleanupTimer);
  io.close();
  server.close(async () => {
    await mongoose.connection.close(false);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('[Startup Error]', error.message);
  process.exit(1);
});
