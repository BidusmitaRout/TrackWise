const { isValidCollection } = require('../models/collectionModel');

module.exports = function validateCollection(req, res, next) {
  const collection = req.params.collection;
  if (!isValidCollection(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }
  next();
};
