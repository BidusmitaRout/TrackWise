require('./config/env');

const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const expressLayouts = require('express-ejs-layouts');
const MongoStore = require('connect-mongo');

const connectDB = require('./config/database');
const apiRoutes = require('./routes/apiRoutes');
const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const { ensureCollectionFiles } = require('./models/collectionModel');
const initializePassport = require('./config/passport');
const { MONGO_URI, SESSION_SECRET } = require('./config/env');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', viewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
ensureCollectionFiles();
connectDB();
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
