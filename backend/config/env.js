const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trackwise',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  SESSION_SECRET: process.env.SESSION_SECRET || 'change-me-too',
};
