const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} ${JSON.stringify(req.query || {})} ${JSON.stringify(req.body || {})}`);
  next();
});

const COLLECTIONS = ['items', 'users', 'achievements', 'progress', 'schedules', 'notes', 'timers'];
const OWNER_SCOPED = new Set(['items', 'achievements', 'progress', 'schedules', 'notes', 'timers']);
const EMAIL_KEYED = new Set(['users']);
const DATA_DIR = path.join(__dirname, 'data');
const COLLECTION_FILES = {
  items: path.join(DATA_DIR, 'items.json'),
  users: path.join(DATA_DIR, 'users.json'),
  achievements: path.join(DATA_DIR, 'achievements.json'),
  progress: path.join(DATA_DIR, 'progress.json'),
  schedules: path.join(DATA_DIR, 'schedules.json'),
  notes: path.join(DATA_DIR, 'notes.json'),
  timers: path.join(DATA_DIR, 'timers.json')
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCollection(collection) {
  try {
    const filePath = COLLECTION_FILES[collection];
    if (!filePath || !fs.existsSync(filePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeCollection(collection, data) {
  const filePath = COLLECTION_FILES[collection];
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function ensureCollectionFiles() {
  ensureDataDir();
  COLLECTIONS.forEach((collection) => {
    const filePath = COLLECTION_FILES[collection];
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
    }
  });
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function pickCollectionData(data, collection, userQuery) {
  if (!OWNER_SCOPED.has(collection) || !userQuery) return data;
  return data.filter((item) => item.owner === userQuery);
}

function getItemById(collectionData, idParam) {
  const id = String(idParam);
  return collectionData.find((item) => String(item.id) === id);
}

function requireUserForOwnerScoped(collection, req, res) {
  if (!OWNER_SCOPED.has(collection)) return true;
  const owner = req.body && req.body.owner;
  if (!owner) {
    res.status(400).json({ error: 'owner is required for this collection' });
    return false;
  }
  return true;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, collections: COLLECTIONS, storage: 'file-json-per-collection' });
});

app.get('/api/:collection', (req, res) => {
  const collection = req.params.collection;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const collectionData = readCollection(collection);
  const user = req.query.user;
  const data = pickCollectionData(collectionData, collection, user);
  return res.json(data);
});

app.get('/api/:collection/:id', (req, res) => {
  const collection = req.params.collection;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const collectionData = readCollection(collection);
  const item = getItemById(collectionData, req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (OWNER_SCOPED.has(collection) && req.query.user && item.owner !== req.query.user) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.json(item);
});

app.post('/api/:collection', (req, res) => {
  const collection = req.params.collection;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }
  if (!requireUserForOwnerScoped(collection, req, res)) return;

  const payload = req.body || {};
  const collectionData = readCollection(collection);

  if (EMAIL_KEYED.has(collection)) {
    const email = String(payload.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email is required' });
    const exists = collectionData.find((u) => String(u.email || '').toLowerCase() === email);
    if (exists) return res.status(409).json({ error: 'User already exists' });
    const user = { id: generateId(), ...payload, email };
    collectionData.push(user);
    writeCollection(collection, collectionData);
    return res.status(201).json(user);
  }

  const item = { id: generateId(), ...payload };
  collectionData.push(item);
  writeCollection(collection, collectionData);
  return res.status(201).json(item);
});

app.put('/api/:collection/:id', (req, res) => {
  const collection = req.params.collection;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const collectionData = readCollection(collection);
  const idx = collectionData.findIndex((item) => String(item.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const current = collectionData[idx];
  if (OWNER_SCOPED.has(collection) && req.body && req.body.owner && current.owner !== req.body.owner) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  collectionData[idx] = { ...current, ...req.body, id: current.id };
  writeCollection(collection, collectionData);
  return res.json(collectionData[idx]);
});

app.delete('/api/:collection/:id', (req, res) => {
  const collection = req.params.collection;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Unknown collection' });
  }

  const collectionData = readCollection(collection);
  const idx = collectionData.findIndex((item) => String(item.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const current = collectionData[idx];
  if (OWNER_SCOPED.has(collection) && req.query.user && current.owner !== req.query.user) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const removed = collectionData.splice(idx, 1)[0];
  writeCollection(collection, collectionData);
  return res.json(removed);
});

const PORT = process.env.PORT || 3000;
ensureCollectionFiles();
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
