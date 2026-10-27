const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parkeasy';
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10_000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
    minPoolSize: 2,
    retryWrites: true,
  });

  console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

mongoose.connection.on('disconnected', () => console.warn('[Database] MongoDB disconnected.'));
mongoose.connection.on('reconnected', () => console.log('[Database] MongoDB reconnected.'));
mongoose.connection.on('error', (error) => console.error('[Database] MongoDB error:', error.message));

module.exports = connectDB;
