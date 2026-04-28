module.exports = function requestLogger(req, res, next) {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} ${JSON.stringify(req.query || {})} ${JSON.stringify(req.body || {})}`
  );
  next();
};
