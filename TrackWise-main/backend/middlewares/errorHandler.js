module.exports = function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  if (res.headersSent) {
    return next(err);
  }

  if (req.accepts('html')) {
    return res.status(err.status || 500).render('error', {
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'production' ? {} : err,
    });
  }

  return res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};
