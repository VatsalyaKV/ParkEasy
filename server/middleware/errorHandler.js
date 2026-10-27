const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err.message);

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID.';
  }
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `A record with this ${field} already exists.` : 'A duplicate record already exists.';
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  }
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongooseServerSelectionError') {
    statusCode = 503;
    message = 'Database is temporarily unavailable. Please try again shortly.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'production' ? {} : { errorType: err.name }),
  });
};

module.exports = errorHandler;
