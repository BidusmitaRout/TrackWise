const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const COLLECTIONS = ['items', 'users', 'achievements', 'progress', 'schedules', 'notes', 'timers', 'forums', 'quizzes'];
const OWNER_SCOPED = new Set(['items', 'achievements', 'progress', 'schedules', 'notes', 'timers', 'forums', 'quizzes']);
const EMAIL_KEYED = new Set(['users']);
const COLLECTION_FILES = {
  items: path.join(DATA_DIR, 'items.json'),
  users: path.join(DATA_DIR, 'users.json'),
  achievements: path.join(DATA_DIR, 'achievements.json'),
  progress: path.join(DATA_DIR, 'progress.json'),
  schedules: path.join(DATA_DIR, 'schedules.json'),
  notes: path.join(DATA_DIR, 'notes.json'),
  timers: path.join(DATA_DIR, 'timers.json'),
  forums: path.join(DATA_DIR, 'forums.json'),
  quizzes: path.join(DATA_DIR, 'quizzes.json')
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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

function isValidCollection(collection) {
  return COLLECTIONS.includes(collection);
}

function isOwnerScoped(collection) {
  return OWNER_SCOPED.has(collection);
}

function isEmailKeyed(collection) {
  return EMAIL_KEYED.has(collection);
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

function pickCollectionData(data, collection, userQuery) {
  if (!isOwnerScoped(collection) || !userQuery) return data;
  return data.filter((item) => item.owner === userQuery);
}

function getItemById(collectionData, idParam) {
  const id = String(idParam);
  return collectionData.find((item) => String(item.id) === id);
}

module.exports = {
  COLLECTIONS,
  isValidCollection,
  isOwnerScoped,
  isEmailKeyed,
  ensureCollectionFiles,
  generateId,
  readCollection,
  writeCollection,
  pickCollectionData,
  getItemById
};
