const User = require('../models/userModel');
const { hashPassword } = require('../utils/bcrypt');
const {
  COLLECTIONS,
  isOwnerScoped,
  isEmailKeyed,
  generateId,
  readCollection,
  writeCollection,
  pickCollectionData,
  getItemById
} = require('../models/collectionModel');

const publicUser = (user) => ({
  id: String(user._id || user.id),
  email: user.email,
  name: user.name,
  phone: user.phone,
  createdAt: user.createdAt,
});

const health = (req, res) => {
  res.json({ ok: true, collections: COLLECTIONS, storage: 'mongo-for-users-json-for-rest' });
};

const listCollection = async (req, res) => {
  const collection = req.params.collection;

  if (collection === 'users') {
    const queryEmail = String(req.query.user || (req.user && req.user.email) || '').trim().toLowerCase();
    const users = await User.find().select('email name phone createdAt').lean();
    const filtered = queryEmail
      ? users.filter((user) => String(user.email || '').toLowerCase() === queryEmail)
      : users;
    return res.json(filtered.map(publicUser));
  }

  const collectionData = readCollection(collection);
  const userEmail = req.user ? req.user.email : req.query.user;
  const data = pickCollectionData(collectionData, collection, userEmail);
  return res.json(data);
};

const getCollectionItem = async (req, res) => {
  const collection = req.params.collection;

  if (collection === 'users') {
    const user = await User.findById(req.params.id).select('email name phone createdAt').lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json(publicUser(user));
  }

  const collectionData = readCollection(collection);
  const item = getItemById(collectionData, req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (isOwnerScoped(collection) && req.user && item.owner !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(item);
};

const createCollectionItem = async (req, res) => {
  const collection = req.params.collection;
  const payload = req.body || {};

  if (collection === 'users') {
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      password: hashedPassword,
      name: payload.name,
      phone: payload.phone,
    });
    return res.status(201).json(publicUser(user));
  }

  if (isOwnerScoped(collection)) {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    payload.owner = req.user.email;
  }

  const collectionData = readCollection(collection);
  const item = { id: generateId(), ...payload };
  collectionData.push(item);
  writeCollection(collection, collectionData);
  return res.status(201).json(item);
};

const updateCollectionItem = async (req, res) => {
  const collection = req.params.collection;
  const payload = req.body || {};

  if (collection === 'users') {
    const updatePayload = { ...payload };
    if (updatePayload.password) {
      updatePayload.password = await hashPassword(updatePayload.password);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    }).select('email name phone createdAt');
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json(publicUser(user));
  }

  const collectionData = readCollection(collection);
  const idx = collectionData.findIndex((item) => String(item.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const current = collectionData[idx];
  if (isOwnerScoped(collection)) {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (current.owner !== req.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    payload.owner = req.user.email;
  }

  collectionData[idx] = { ...current, ...payload, id: current.id };
  writeCollection(collection, collectionData);
  return res.json(collectionData[idx]);
};

const deleteCollectionItem = async (req, res) => {
  const collection = req.params.collection;

  if (collection === 'users') {
    const user = await User.findByIdAndDelete(req.params.id).select('email name phone createdAt');
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json(publicUser(user));
  }

  const collectionData = readCollection(collection);
  const idx = collectionData.findIndex((item) => String(item.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const current = collectionData[idx];
  if (isOwnerScoped(collection)) {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (current.owner !== req.user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const removed = collectionData.splice(idx, 1)[0];
  writeCollection(collection, collectionData);
  return res.json(removed);
};

module.exports = {
  health,
  listCollection,
  getCollectionItem,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
};
